
---

# DeepSession – Data Fetching & Offline Strategy (Summary)

## 0. High-level architecture

* **Source of truth:**
  🔹 **Firestore + `onSnapshot`** (with offline persistence enabled)
* **UI cache layer:**
  🔹 **React Query** – bas view cache ke liye, not a 2nd source of truth
* **Write pattern:**
  🔹 `addDoc / updateDoc / deleteDoc` → Firestore handle offline queue + sync
  🔹 React Query se **optimistic updates** (correct `Session` shape)

---

## 1. Data READ – Best Practices

### ✅ DO

* **Use `onSnapshot` for sessions/goals:**

  ```ts
  const q = query(
    collection(db, 'sessions'),
    where('userId', '==', userId),
    orderBy('started_at', 'desc')
  );

  const unsub = onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs
      .map(adaptDocToSession) // Firestore → Session
      .filter(Boolean);
    queryClient.setQueryData(['sessions', userId], sessions);
  });
  ```

* **Keep a separate adapter** to map Firestore ↔ UI:

  ```ts
  // Firestore -> Session
  const adaptDocToSession = (doc: QueryDocumentSnapshot): Session | null => {
    const data = doc.data() as FirestoreSessionData;
    const startTime = new Date(data.started_at).getTime();
    const endTime = new Date(data.ended_at).getTime();
    if (isNaN(startTime) || isNaN(endTime)) return null;

    return {
      id: doc.id,
      title: data.title,
      type: data.session_type_id,
      notes: data.notes || '',
      sessionTime: data.total_focus_ms,
      breakTime: data.total_break_ms,
      startTime,
      endTime,
      date: new Date(startTime).toISOString().split('T')[0],
    };
  };
  ```

* **Use `getDocs` only as initial fetch** (React Query `queryFn`), then rely on `onSnapshot` for updates.

* **Respect Firestore offline behavior:**

  * `snapshot.metadata.fromCache === true` → data local se aa raha hai
  * `doc.metadata.fromCache` → per-doc cache info

### ❌ DON’T

* `getDocs` ko har mount pe blindly call mat karo jab `onSnapshot` already data push kar raha ho.
* Same data ke liye **alag-alag shapes** mat use karo (e.g. kabhi `Session`, kabhi `FinalV0DataInput`) – cache hamesha ek hi consistent type ho.

---

## 2. Data WRITE (Create Session) – Best Practices

### ✅ DO

* **Write to Firestore using v0 shape**, but **cache me hamesha `Session` shape:**

  ```ts
  const dataToSave = {
    id: sessionData.id,        // internal v0 id
    userId: user.uid,
    title: sessionData.title,
    session_type_id: sessionData.session_type_id,
    notes: sessionData.notes,
    breaks: sessionData.breaks,
    started_at: sessionData.started_at,
    ended_at: sessionData.ended_at,
    total_focus_ms: sessionData.total_focus_ms,
    total_break_ms: sessionData.total_break_ms,
    created_at: serverTimestamp(),
  };

  await addDoc(collection(db, 'sessions'), dataToSave);
  ```

* **Use optimistic update → but with correct UI type:**

  ```ts
  onMutate: async (newSession) => {
    const key = ['sessions', newSession.userId];
    await qc.cancelQueries({ queryKey: key });

    const previous = (qc.getQueryData<Session[]>(key) || []).slice();

    const startTime = new Date(newSession.started_at).getTime();
    const endTime = new Date(newSession.ended_at).getTime();
    const date = newSession.started_at.split('T')[0];

    const optimisticSession: Session = {
      id: newSession.id, // nanoid() from tracker
      title: newSession.title,
      type: newSession.session_type_id,
      notes: newSession.notes,
      sessionTime: newSession.total_focus_ms,
      breakTime: newSession.total_break_ms,
      startTime,
      endTime,
      date,
    };

    qc.setQueryData<Session[]>(key, (old = []) => [optimisticSession, ...old]);

    return { key, previous };
  },
  ```

* **Rollback on error:**

  ```ts
  onError: (error, _vars, ctx) => {
    if (ctx?.key && ctx.previous) {
      qc.setQueryData(ctx.key, ctx.previous);
    }
    toast.error('Failed to save session', { description: error.message });
  },
  ```

* **Let `onSnapshot` overwrite cache** once Firestore confirms.

### ❌ DON’T

* **DON’T** push `FinalV0DataInput` directly into React Query cache.
  → UI `Session` type se mismatch ho jayega → `NaNm`, `Invalid Date` issues.

* **DON’T** over-engineer ID logic:

  * `nanoid()` from tracker is enough for local `Session.id`.
  * No need for `_localId` unless you implement complex reconciliation.

* **DON’T** run `invalidateQueries(['sessions'])` aggressively; snapshot already sync karega.

---

## 3. React Query Configuration

Recommended defaults:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 60,    // 1 hour
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 1,
    },
  },
});
```

* **Reason:**

  * Firestore + onSnapshot already background sync kar raha hai →
    React Query ko “aggressive refetch engine” ke jaise behave nahi karwana.

---

## 4. Logging & Debugging

### ✅ DO

* Use a small logger util to inspect fetch behavior:

  ```ts
  export function logSessionsFetch(opts: {
    source: 'fetch' | 'snapshot';
    userId: string;
    count: number;
    fromCacheSnapshot?: boolean;
    fromCacheCount?: number;
    fromServerCount?: number;
  }) {
    const ts = new Date().toISOString();
    console.groupCollapsed(
      `[sessions:${opts.source}] user=${opts.userId} count=${opts.count} @ ${ts}`
    );
    if (opts.fromCacheSnapshot != null) {
      console.log('snapshot.metadata.fromCache:', opts.fromCacheSnapshot);
    }
    if (opts.fromCacheCount != null || opts.fromServerCount != null) {
      console.log('docs from cache:', opts.fromCacheCount);
      console.log('docs from server:', opts.fromServerCount);
    }
    console.groupEnd();
  }
  ```

* In `fetchSessions`:

  ```ts
  const qs = await getDocs(q);
  let fromCacheCount = 0;
  let fromServerCount = 0;
  qs.docs.forEach(d =>
    d.metadata.fromCache ? fromCacheCount++ : fromServerCount++
  );

  logSessionsFetch({
    source: 'fetch',
    userId,
    count: sessions.length,
    fromCacheCount,
    fromServerCount,
  });
  ```

* In `onSnapshot`:

  ```ts
  onSnapshot(q, (snapshot) => {
    const sessions = ...
    qc.setQueryData(['sessions', userId], sessions);

    logSessionsFetch({
      source: 'snapshot',
      userId,
      count: sessions.length,
      fromCacheSnapshot: snapshot.metadata.fromCache,
    });
  });
  ```

### ❌ DON’T

* `navigator.onLine` pe zyada trust mat karo:

  * `true` ho sakta hai even when actual internet down.
  * Real info ke liye better: `snapshot.metadata.fromCache` + request success/failure.

---

## 5. Things to remember (Do’s & Don’ts TL;DR)

### ✅ DO

* Firestore + `onSnapshot` = **single source of truth**.
* `SessionTracker` → `FinalV0DataInput` → Firestore write.
* UI list / analytics → `Session` type only.
* Optimistic updates always use `Session` shape.
* Use TypeScript generics with `useMutation<TData, TError, TVars, TContext>`.

### ❌ DON’T

* Don’t mix Firestore raw data and UI `Session` type in same cache.
* Don’t use React Query refetch as primary sync when `onSnapshot` already handling it.
* Don’t spam `invalidateQueries` on every small thing.
* Don’t depend on `navigator.onLine` to decide offline/online logic.

---
