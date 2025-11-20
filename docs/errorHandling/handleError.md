 —
The `formatError` utility accepts a `fallback` parameter, so you can pass in different defaults depending on the context. That way, you don’t hard‑code “An unexpected error occurred” everywhere.

---

## 🔧 Updated Utility

```ts
// utils/error.ts
export function formatError(err: unknown, fallback: string = 'An unexpected error occurred'): string {
  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err === 'string') {
    return err;
  }

  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code?: string }).code;
    return `Error code: ${code ?? 'unknown'}`;
  }

  return fallback;
}
```

---

## 🎯 Usage Examples

### Case 1: Verification Email
```ts
 catch (err: unknown) {
  setError(formatError(err, 'Failed to send verification email'));
}
```

### Case 2: Login Flow
```ts
 catch (err: unknown) {
  setError(formatError(err, 'Login failed. Please try again.'));
}
```

### Case 3: Analytics Fetch
```ts
 catch (err: unknown) {
  setError(formatError(err, 'Unable to load analytics data.'));
}
```

---

## 🪄 Why This Helps
- **Contextual messaging** → each feature can provide its own fallback string.
- **Consistency** → you still get the real error message if available.
- **Flexibility** → you can extend the utility later (e.g., map Firebase error codes to friendly text).

---

👉 since we’re building modular architecture, we could even define a small **enum of fallback messages** (e.g., `ErrorFallbacks.Verification`, `ErrorFallbacks.Login`) and pass those in. That way, error handling stays centralized and audit‑friendly.  

