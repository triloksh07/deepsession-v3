I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase already has strong offline-first foundations: Firebase Auth persistence (`browserLocalPersistence`), Firestore offline cache (`persistentLocalCache` with `persistentMultipleTabManager`), TanStack Query for data fetching, and prefetching in `AuthProvider`. However, dashboard pages lack Suspense boundaries, loading states, and SSR shells. The service worker registration exists but no actual worker file. Pages are fully client-rendered without progressive enhancement.

### Approach

Implement hybrid SSR shells with client-side data hydration by wrapping data-dependent sections in Suspense boundaries with skeleton loaders, while keeping layout/navigation server-renderable. Create a production-ready service worker with runtime caching strategies for static assets and Firebase API responses. Enhance offline testing by exposing loading states from `DashboardProvider` and adding network status indicators. Maintain the client-only auth model without server-side data fetching to preserve offline-first architecture.

### Reasoning

Explored the repository structure, read all dashboard pages (overview, sessions, goals, analytics, export-data), examined data fetching hooks (`useSessionsQuery`, `useGoalsQuery`, `useSyncActiveSession`), reviewed `AuthProvider` and `DashboardProvider` implementations, checked Firebase configuration for offline settings, and analyzed the service worker registration component. Confirmed offline persistence is enabled but UI lacks progressive loading patterns.

## Mermaid Diagram

sequenceDiagram
    participant Browser
    participant SSR as SSR Shell
    participant React as React Hydration
    participant Suspense
    participant ClientSDK as Firebase Client SDK
    participant Cache as IndexedDB Cache
    participant Firestore
    participant SW as Service Worker

    Browser->>SSR: Request /dashboard/overview
    SSR->>Browser: Return HTML (Layout + Nav + Header)
    Browser->>React: Start Hydration
    React->>Suspense: Render with Fallback
    Suspense->>Browser: Show Skeleton Loader
    
    React->>ClientSDK: Request Sessions/Goals
    ClientSDK->>Cache: Check IndexedDB
    
    alt Data in Cache (Offline or Fast)
        Cache-->>ClientSDK: Return Cached Data
        ClientSDK-->>Suspense: Data Ready
        Suspense->>Browser: Show Real Content
    else No Cache / Online
        ClientSDK->>Firestore: Fetch from Network
        Firestore-->>ClientSDK: Return Data
        ClientSDK->>Cache: Update Cache
        ClientSDK-->>Suspense: Data Ready
        Suspense->>Browser: Show Real Content
    end
    
    Browser->>SW: Request Static Assets
    SW->>Browser: Serve from Cache (Offline-First)
    
    Note over Browser,Firestore: User makes changes offline
    Browser->>ClientSDK: Mutation (Create/Update/Delete)
    ClientSDK->>Cache: Queue Mutation
    ClientSDK->>Browser: Optimistic Update
    
    Note over Browser,Firestore: User comes back online
    ClientSDK->>Firestore: Sync Queued Mutations
    Firestore-->>ClientSDK: Confirm Sync
    ClientSDK->>Cache: Update Cache
    ClientSDK->>Browser: Real-time Update via onSnapshot

## Proposed File Changes

### app/(authed)/dashboard/_components/LoadingFallbacks.tsx(NEW)

References: 

- app/(authed)/dashboard/overview/page.tsx(MODIFY)
- app/(authed)/dashboard/sessions/page.tsx(MODIFY)
- app/(authed)/dashboard/goals/page.tsx(MODIFY)

Create a new file with reusable loading skeleton components for Suspense fallbacks. Export `DashboardOverviewSkeleton` with card skeletons matching the overview page layout (3 stat cards, 2 activity cards). Export `SessionsListSkeleton` with grouped date sections and session card skeletons. Export `GoalsListSkeleton` with goal card skeletons showing progress bars. Export `AnalyticsSkeleton` with chart placeholder skeletons. Export `ExportDataSkeleton` with form skeleton. Use `Skeleton` component from `@/components/ui/skeleton` (create if doesn't exist using Tailwind's `animate-pulse` and `bg-muted` classes). Match the card structure and spacing of actual pages for seamless transitions.

### components/ui/skeleton.tsx(MODIFY)

References: 

- lib/utils.ts

Create a Skeleton component if it doesn't exist. Export a `Skeleton` component that renders a `div` with `className="animate-pulse rounded-md bg-muted"` and accepts additional className props via `cn()` utility from `@/lib/utils`. This will be used by loading fallbacks to show placeholder UI during data loading.

### app/(authed)/dashboard/_components/DashboardProvider.tsx(MODIFY)

References: 

- hooks/useSessionsQuery.ts
- hooks/useGoalsQuery.ts

Update the provider to expose loading states more granularly for Suspense integration. Keep the existing context structure but ensure `isLoading`, `isError`, and `error` are properly exposed. Add a check to prevent rendering children until initial data is available (return `null` or a minimal loading state if `isLoading` is true on first mount). This ensures Suspense boundaries work correctly. Alternatively, consider splitting into separate contexts for sessions and goals to enable independent Suspense boundaries, but keep current unified approach for simplicity. Document that pages should wrap data-dependent sections in Suspense.

### app/(authed)/dashboard/overview/page.tsx(MODIFY)

References: 

- app/(authed)/dashboard/_components/DashboardProvider.tsx(MODIFY)
- app/(authed)/dashboard/_components/LoadingFallbacks.tsx(NEW)

Wrap data-dependent sections in Suspense boundaries with `DashboardOverviewSkeleton` fallback from `@/app/(authed)/dashboard/_components/LoadingFallbacks`. Keep the page as a client component. Extract the main dashboard content into a separate `DashboardContent` component that uses `useDashboard()` hook. In the main `Dashboard` export, render the SSR shell (header with title and description) immediately, then wrap `<Suspense fallback={<DashboardOverviewSkeleton />}><DashboardContent /></Suspense>`. The `SessionTracker` component should remain outside Suspense as it manages its own state. This allows the layout to render immediately while data loads from cache or network.

### app/(authed)/dashboard/sessions/page.tsx(MODIFY)

References: 

- app/(authed)/dashboard/_components/DashboardProvider.tsx(MODIFY)
- app/(authed)/dashboard/_components/LoadingFallbacks.tsx(NEW)

Wrap the sessions list in Suspense with `SessionsListSkeleton` fallback. Extract the session list rendering logic into a `SessionsContent` component that uses `useDashboard()`. In the main `SessionLog` export, render the page title/header immediately as SSR shell, then wrap `<Suspense fallback={<SessionsListSkeleton />}><SessionsContent /></Suspense>`. Keep edit/delete dialogs outside Suspense as they're controlled by local state. Handle the empty state (no sessions) inside `SessionsContent` after data loads.

### app/(authed)/dashboard/goals/page.tsx(MODIFY)

References: 

- app/(authed)/dashboard/_components/DashboardProvider.tsx(MODIFY)
- app/(authed)/dashboard/_components/LoadingFallbacks.tsx(NEW)

Wrap goals list in Suspense with `GoalsListSkeleton` fallback. Extract goals rendering into `GoalsContent` component using `useDashboard()`. In main `Goals` export, render header with "New Goal" button immediately as SSR shell, then wrap `<Suspense fallback={<GoalsListSkeleton />}><GoalsContent /></Suspense>`. Keep the create/edit dialog outside Suspense as it's controlled by local state. The dialog should remain functional even during loading. Handle empty state inside `GoalsContent`.

### app/(authed)/dashboard/analytics/page.tsx(MODIFY)

References: 

- app/(authed)/dashboard/_components/DashboardProvider.tsx(MODIFY)
- app/(authed)/dashboard/_components/LoadingFallbacks.tsx(NEW)

Wrap analytics charts in Suspense with `AnalyticsSkeleton` fallback. Extract chart rendering into `AnalyticsContent` component using `useDashboard()`. In main `Analytics` export, render header with time range selector immediately as SSR shell, then wrap `<Suspense fallback={<AnalyticsSkeleton />}><AnalyticsContent /></Suspense>`. The time range selector should remain functional and update the Suspense boundary when changed. Handle empty state (no sessions) inside `AnalyticsContent`. The `useMemo` calculations should remain in `AnalyticsContent` to optimize re-renders.

### app/(authed)/dashboard/export-data/page.tsx(MODIFY)

References: 

- app/(authed)/dashboard/_components/DashboardProvider.tsx(MODIFY)
- app/(authed)/dashboard/_components/LoadingFallbacks.tsx(NEW)

Wrap export preview section in Suspense with `ExportDataSkeleton` fallback. Extract preview rendering into `ExportPreview` component using `useDashboard()`. In main `ExportData` export, render header and export settings form immediately as SSR shell, then wrap `<Suspense fallback={<ExportDataSkeleton />}><ExportPreview /></Suspense>` for the preview card. The export settings form should remain functional during loading. The export button should be disabled if data is still loading (check `isLoading` from context).

### app/(authed)/dashboard/layout.tsx(MODIFY)

References: 

- context/AuthProvider.tsx(MODIFY)
- app/(authed)/dashboard/_components/Navbar2.tsx

Update the layout to render SSR shell properly. Keep as client component for auth guards. Improve the loading state handling: instead of returning a text message when `!user`, return `null` to avoid flash of content. The `useEffect` redirect logic should remain but add a loading indicator during auth check (when `loading` is true, return a centered skeleton). Wrap the main content area in an ErrorBoundary (create if needed) to catch any Suspense errors. The `Navbar` should render immediately as part of SSR shell. Document that this layout provides the auth-protected shell while individual pages handle their own data loading with Suspense.

### public/sw.js(NEW)

References: 

- components/serviceWorker.tsx(MODIFY)

Create a production-ready service worker file with runtime caching strategies. Implement cache versioning with `CACHE_VERSION` constant (e.g., 'v3-1.0.0'). Define cache names: `STATIC_CACHE` for static assets, `FIREBASE_CACHE` for Firebase API responses, `RUNTIME_CACHE` for dynamic content. In `install` event, precache critical static assets (/_next/static/*, /manifest.json, /favicon.ico). In `activate` event, clean up old caches by deleting any cache not matching current version. In `fetch` event, implement caching strategies: (1) Static assets (/_next/static/*, *.js, *.css, *.woff2): Cache-first with fallback to network. (2) Firebase API requests (firestore.googleapis.com, securetoken.google.com): Network-first with cache fallback for offline support, cache successful GET responses only, skip caching mutations (POST/PUT/DELETE). (3) Navigation requests: Network-first with cache fallback. (4) Images: Cache-first with network fallback. Add error handling for failed fetches. Use `skipWaiting()` and `clients.claim()` for immediate activation. Add console logs for debugging (cache hits, misses, errors). Document that this worker enables offline-first data access while respecting Firebase's real-time sync when online.

### components/serviceWorker.tsx(MODIFY)

References: 

- public/sw.js(NEW)

Enhance the service worker registration component with better lifecycle handling and user notifications. Add state to track registration status (`'installing' | 'waiting' | 'active' | 'error' | null`). In the registration promise, listen for `updatefound` event and track the installing worker's state changes. When a new worker is waiting (update available), show a toast notification (use `sonner` from `@/components/ui/sonner` if available) prompting user to reload for updates, with a "Reload" button that calls `registration.waiting.postMessage({ type: 'SKIP_WAITING' })` and then `window.location.reload()`. Add a message listener for the service worker to handle `SKIP_WAITING` messages. Log registration success/failure with detailed messages. Add a manual update check button (optional, for testing) that calls `registration.update()`. Document that this enables offline-first PWA capabilities with automatic updates.

### context/AuthProvider.tsx(MODIFY)

References: 

- hooks/useSessionsQuery.ts
- hooks/useGoalsQuery.ts
- lib/firebase.ts(MODIFY)

Enhance the prefetching logic to be more robust for offline use. The current implementation is good but add error handling for prefetch failures (wrap in try-catch, log errors but don't block). Add a comment explaining that prefetching primes TanStack Query's cache for immediate offline access. Consider adding a `refetchOnMount: false` option to the prefetch calls to prevent unnecessary refetches when pages mount (data is already cached). Ensure `setPersistence` is called before any auth operations (move to top of component if needed). Add a console log when prefetching completes successfully for debugging. The `useSyncActiveSession` call should remain as-is since it handles real-time sync correctly.

### components/NetworkStatusHandler.tsx(MODIFY)

References: 

- hooks/useNetworkStatus.ts
- app/(authed)/dashboard/_components/Navbar2.tsx

Enhance the existing network status handler (if it exists) or create it to show offline/online indicators. Use the `useNetworkStatus` hook from `@/hooks/useNetworkStatus` to detect online/offline state. Display a non-intrusive banner at the top of the dashboard (or as a toast) when offline, showing "You're offline. Changes will sync when you reconnect." with a cloud-off icon. When coming back online, show a brief "Back online" toast with a check icon. Use `sonner` for toast notifications. Add a small indicator in the navbar (optional) showing connection status with a colored dot (green=online, gray=offline). This provides clear feedback about offline mode without being disruptive.

### lib/firebase.ts(MODIFY)

The Firebase configuration already has excellent offline support with `persistentLocalCache` and `persistentMultipleTabManager`. Add a comment documenting this setup for future developers: explain that `persistentLocalCache` enables IndexedDB-based offline persistence, `persistentMultipleTabManager` allows multiple tabs to share the same cache, and this replaces the deprecated `enableIndexedDbPersistence()` API. Optionally, add error handling for initialization failures (wrap in try-catch) and log any errors. Consider exporting a `isOfflineEnabled` boolean constant set to `true` for documentation purposes. No functional changes needed as the current setup is optimal.

### docs/OFFLINE_TESTING.md(NEW)

References: 

- lib/firebase.ts(MODIFY)
- public/sw.js(NEW)
- components/NetworkStatusHandler.tsx(MODIFY)

Create a comprehensive offline testing guide. Document how to test offline capabilities: (1) Open DevTools → Network tab → Enable "Offline" throttling. (2) Verify auth persists (user stays logged in). (3) Navigate between dashboard pages and verify data loads from cache instantly. (4) Create/edit/delete sessions and goals while offline, verify they queue. (5) Go back online and verify queued mutations sync to Firestore. (6) Test service worker caching: disable network, reload page, verify static assets load from cache. (7) Test cross-tab sync: open two tabs, make changes in one, verify the other updates via `onSnapshot`. Include screenshots or GIFs if possible. Document expected behaviors: data should load instantly from cache, mutations should queue and show optimistic updates, network status indicator should appear, service worker should cache assets. Add troubleshooting section for common issues (cache not working, mutations not syncing, etc.). Reference `lib/firebase.ts` for offline config and `public/sw.js` for caching strategies.

### docs/v3-architecture.md(MODIFY)

References: 

- app/(authed)/dashboard/layout.tsx(MODIFY)
- app/(authed)/dashboard/_components/LoadingFallbacks.tsx(NEW)
- public/sw.js(NEW)
- docs/OFFLINE_TESTING.md(NEW)

Update the architecture documentation to reflect the new SSR shell + Suspense pattern. Add a section titled "SSR and Data Loading Strategy" explaining: (1) Dashboard layout renders SSR shell (navbar, auth guards) immediately. (2) Individual pages render non-data UI (headers, buttons) as SSR shell. (3) Data-dependent sections wrapped in Suspense with skeleton fallbacks. (4) Data loads via Client SDK after hydration from IndexedDB cache (instant) or network. (5) No server-side data fetching to preserve offline-first architecture. Add a section on "Offline Capabilities" documenting: Firebase Auth persistence, Firestore offline cache, service worker caching strategies, TanStack Query cache, prefetching on login, queued mutations, cross-tab sync via `onSnapshot`. Add a diagram (mermaid or ASCII) showing the data flow: User → SSR Shell → Hydration → Client SDK → IndexedDB Cache → Firestore (when online). Reference the new files: `LoadingFallbacks.tsx`, `sw.js`, `OFFLINE_TESTING.md`. Update the "Performance" section to mention Suspense streaming and progressive enhancement.