I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The dashboard currently uses a `(group)` route group to nest pages under `app/(authed)/dashboard/(group)/`, with five pages: `overview`, `sessions`, `goals`, `analytics`, and `export-data`. The main dashboard page (`app/(authed)/dashboard/page.tsx`) dynamically imports `DashboardShell`, which renders `DashboardContent` that only shows the overview component. Navigation is handled by `Navbar2.tsx`, which currently lacks route links and active state highlighting. Authentication guards are implemented in `clientWrapper.tsx`, which wraps children with `DashboardProvider` after checking auth status and email verification. All dashboard pages are client components that consume data via the `useDashboard()` hook from `DashboardProvider`, which uses TanStack Query for data fetching and Zustand store for session state management.

### Approach

The migration will restructure the dashboard from a single-page tab-based architecture to a multi-page Next.js routing system. This involves: 
1. removing the `(group)` folder and promoting child routes to top-level dashboard routes, 
2. converting `Navbar2.tsx` to use Next.js `Link` components with `usePathname()` for active state, 
3. moving auth guards from `clientWrapper.tsx` directly into `layout.tsx` as a client component wrapper, 
4. implementing a server-side redirect from `/dashboard` to `/dashboard/overview`, 
5. removing obsolete components (`DashboardShell`, `DashboardContent`), and 
6. ensuring the layout renders SSR shells while pages hydrate client data. This approach maintains all existing client-side functionality (TanStack Query, Zustand, real-time sync) while enabling proper URL-based navigation, browser history, and improved SEO for authenticated routes.

### Reasoning

I explored the repository structure to understand the current dashboard architecture, then read the key files including the layout, main dashboard page, nested route pages, navigation component, auth wrapper, and provider components. I searched for navigation patterns and examined how auth guards and data fetching are currently implemented to identify the components that need modification or removal.

## Mermaid Diagram

sequenceDiagram
    participant User
    participant Browser
    participant Layout as Dashboard Layout<br/>(Client Component)
    participant AuthProvider
    participant Navbar
    participant Page as Dashboard Page<br/>(Overview/Sessions/etc.)
    participant DashboardProvider
    participant Firestore

    User->>Browser: Navigate to /dashboard
    Browser->>Layout: Server renders layout shell
    Layout->>Browser: Return SSR HTML (nav, container)
    Browser->>Layout: Hydrate client component
    Layout->>AuthProvider: useAuth() - check auth state
    AuthProvider->>Layout: Return {user, loading}
    
    alt User not authenticated
        Layout->>Browser: router.push('/login')
    else User not verified
        Layout->>Browser: router.push('/verify-email')
    else User authenticated & verified
        Layout->>DashboardProvider: Wrap children with provider (user.uid)
        DashboardProvider->>Firestore: Fetch sessions & goals (TanStack Query)
        Firestore-->>DashboardProvider: Return data
        Layout->>Page: Render dashboard page
        Page->>DashboardProvider: useDashboard() - get data
        DashboardProvider-->>Page: Return {sessions, goals, mutations}
        Page->>Browser: Render page content
    end
    
    User->>Navbar: Click "Sessions" link
    Navbar->>Browser: Navigate to /dashboard/sessions
    Browser->>Page: Load sessions page
    Page->>DashboardProvider: useDashboard() - get data from cache
    DashboardProvider-->>Page: Return cached data (instant)
    Page->>Browser: Render sessions page
    Navbar->>Navbar: Update active state (usePathname)

## Proposed File Changes

### app/(authed)/dashboard/overview(NEW)

Create a new `overview` directory at the top level of the dashboard to replace the nested `(group)/overview` structure. This directory will contain the overview page component.

### app/(authed)/dashboard/overview/page.tsx(NEW)

References: 

- app/(authed)/dashboard/(group)/overview/page.tsx

Move the content from `app/(authed)/dashboard/(group)/overview/page.tsx` to this new location. The component should remain a client component ('use client') and continue to use the `useDashboard()` hook to fetch sessions data. Keep all existing functionality including stats calculations, session tracking, and the `SessionTracker` component. No changes to the component logic are needed—this is purely a file relocation to enable proper routing.

### app/(authed)/dashboard/sessions(NEW)

Create a new `sessions` directory at the top level of the dashboard to replace the nested `(group)/sessions` structure. This directory will contain the sessions page component.

### app/(authed)/dashboard/sessions/page.tsx(NEW)

References: 

- app/(authed)/dashboard/(group)/sessions/page.tsx

Move the content from `app/(authed)/dashboard/(group)/sessions/page.tsx` to this new location. The component should remain a client component and continue using `useDashboard()` for sessions data and `useUpdateSession`/`useDeleteSession` mutations. Preserve all existing functionality including session grouping by date, edit/delete dialogs, and the session type configuration. This is a file relocation only—no logic changes required.

### app/(authed)/dashboard/goals(NEW)

Create a new `goals` directory at the top level of the dashboard to replace the nested `(group)/goals` structure. This directory will contain the goals page component.

### app/(authed)/dashboard/goals/page.tsx(NEW)

References: 

- app/(authed)/dashboard/(group)/goals/page.tsx

Move the content from `app/(authed)/dashboard/(group)/goals/page.tsx` to this new location. The component should remain a client component and continue using `useDashboard()` for goals and sessions data, along with `createGoal`, `updateGoal`, and `deleteGoal` mutations. Keep all existing functionality including goal creation/editing dialogs, progress calculations, and the goal type breakdown. This is purely a file relocation.

### app/(authed)/dashboard/analytics(NEW)

Create a new `analytics` directory at the top level of the dashboard to replace the nested `(group)/analytics` structure. This directory will contain the analytics page component.

### app/(authed)/dashboard/analytics/page.tsx(NEW)

References: 

- app/(authed)/dashboard/(group)/analytics/page.tsx

Move the content from `app/(authed)/dashboard/(group)/analytics/page.tsx` to this new location. The component should remain a client component and continue using `useDashboard()` for sessions and goals data. Preserve all existing functionality including time range filtering, chart rendering with Recharts, analytics calculations (streak, productivity insights), and the heatmap. This is a file relocation only.

### app/(authed)/dashboard/export-data(NEW)

Create a new `export-data` directory at the top level of the dashboard to replace the nested `(group)/export-data` structure. This directory will contain the export data page component.

### app/(authed)/dashboard/export-data/page.tsx(NEW)

References: 

- app/(authed)/dashboard/(group)/export-data/page.tsx

Move the content from `app/(authed)/dashboard/(group)/export-data/page.tsx` to this new location. The component should remain a client component and continue using `useDashboard()` for sessions and goals data. Keep all existing functionality including export format selection (JSON/CSV), export options configuration, data filtering, and the `handleExport` utility from `lib/exportUtils`. This is purely a file relocation.

### app/(authed)/dashboard/(group)(DELETE)

Delete the entire `(group)` directory and all its contents after moving the pages to their new top-level locations. This removes the route group nesting that was used for the old tab-based architecture.

### app/(authed)/dashboard/page.tsx(MODIFY)

Replace the entire content of this file to implement a server-side redirect to `/dashboard/overview`. Remove all client-side code including the `'use client'` directive, `useAuth` hook, `DashboardShell` import, and loading states. Instead, use Next.js's `redirect()` function from `next/navigation` to immediately redirect users to the overview page. This should be a simple server component that just calls `redirect('/dashboard/overview')`. This ensures that accessing `/dashboard` directly will always route to the overview page, making it the default dashboard view.

### app/(authed)/dashboard/layout.tsx(MODIFY)

References: 

- app/(authed)/dashboard/_components/clientWrapper.tsx(DELETE)
- context/AuthProvider.tsx

Transform this layout into a client component that handles both auth guards and data provider wrapping. Add the `'use client'` directive at the top. Replace the `DashboardLayoutWrapper` import with direct implementation of auth guard logic: use `useAuth()` from `context/AuthProvider` to get user and loading state, then use `useEffect` with `useRouter` to redirect unauthenticated users to `/login` and unverified users to `/verify-email` (similar to the logic currently in `clientWrapper.tsx`). Wrap the children with `DashboardProvider` (passing `user.uid`) after auth checks pass. Keep the existing layout structure with `Navbar` and the main content container. Add a loading state that returns `null` while auth is being checked to prevent flash of content. This consolidates auth protection and data provision into the layout, eliminating the need for the separate wrapper component.

### app/(authed)/dashboard/_components/Navbar2.tsx(MODIFY)

Convert the navbar from a static header to a navigation component with route links and active state highlighting. Import `Link` from `next/link` and `usePathname` from `next/navigation`. Remove the unused `activeTab` state and `DashboardContent` import. Add a navigation section between the logo and user menu that renders navigation links for the five dashboard routes: Overview (`/dashboard/overview`), Sessions (`/dashboard/sessions`), Goals (`/dashboard/goals`), Analytics (`/dashboard/analytics`), and Export (`/dashboard/export-data`). Use appropriate icons from lucide-react for each link (e.g., `Home` for Overview, `Clock` for Sessions, `Target` for Goals, `BarChart3` for Analytics, `Download` for Export). Implement active state styling by comparing `usePathname()` with each route path—apply distinct styling (e.g., different background, border, or text color) to the active link. Make the navigation responsive: show full labels on desktop (`md:flex`) and consider a mobile-friendly layout (horizontal scroll or hamburger menu) for smaller screens. Keep the existing user menu, theme toggle, and auth listener logic unchanged.

### app/(authed)/dashboard/_components/DashboardShell.tsx(DELETE)

Delete this file as it's no longer needed. The `DashboardShell` component was used to wrap `DashboardContent` with loading/error states from `ConnectedDataRenderer`, but with the new multi-page architecture, each page component handles its own rendering and the `DashboardProvider` in the layout provides the data context. The auth guard logic has been moved to the layout, making this wrapper obsolete.

### app/(authed)/dashboard/_components/DashboardContent.tsx(DELETE)

Delete this file as it's no longer needed. The `DashboardContent` component was a thin wrapper that rendered the `Dashboard` component from `components/Dashboard.tsx`, which is essentially the same as the overview page. With the new routing structure, the overview page at `/dashboard/overview` directly exports its own component, eliminating the need for this intermediary wrapper.

### app/(authed)/dashboard/_components/clientWrapper.tsx(DELETE)

Delete this file as its functionality has been moved directly into the dashboard layout. The auth guard logic (checking for authenticated user and email verification, redirecting to `/login` or `/verify-email` as needed) and the `DashboardProvider` wrapping are now handled in `app/(authed)/dashboard/layout.tsx`, making this separate wrapper component redundant.

### components/Dashboard.tsx(DELETE)

References: 

- app/(authed)/dashboard/(group)/overview/page.tsx

Delete this file as it's a duplicate of the overview page component. The `Dashboard` component in the components folder is identical to the content in `app/(authed)/dashboard/(group)/overview/page.tsx` (now moved to `app/(authed)/dashboard/overview/page.tsx`). With the new architecture, the overview page component serves as the canonical implementation, and this duplicate in the components folder is no longer referenced or needed.

### app/(authed)/dashboard/_components/DashboardProvider.tsx(MODIFY)

No functional changes are required to this file—it should continue to work as-is with the new architecture. However, verify that the component properly exports `useDashboard` hook and provides sessions, goals, loading states, and mutation functions (createGoal, updateGoal, deleteGoal) via context. Ensure the TanStack Query hooks (`useSessionsQuery`, `useGoalsQuery`) and mutation hooks are correctly imported and used. This provider will now be instantiated in the dashboard layout and consumed by all child page components through the `useDashboard()` hook. Optionally, add JSDoc comments to document the context shape and usage for better developer experience.

### docs/v3-architecture.md(MODIFY)

Update the architecture documentation to reflect the new multi-page dashboard structure. Replace the old structure that showed `(group)` nesting with the new flat structure where pages are directly under `/dashboard/`: `dashboard/page.tsx` (redirects to overview), `dashboard/overview/page.tsx`, `dashboard/sessions/page.tsx`, `dashboard/goals/page.tsx`, `dashboard/analytics/page.tsx`, and `dashboard/export-data/page.tsx`. Update the description of `layout.tsx` to note that it now handles auth guards and wraps children with `DashboardProvider` as a client component. Remove references to the old tab-based navigation and `DashboardShell`. Add notes about the navigation being implemented in `Navbar2` with active route highlighting using `usePathname()`. Include information about the redirect behavior from `/dashboard` to `/dashboard/overview`. Update any diagrams or code examples to match the new structure.