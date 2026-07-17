
# DeepSession Master Roadmap & Architecture Blueprint

## Phase 1: Codebase Hygiene & Core Merge (The Foundation)
*Before building new systems, the existing foundation must be mathematically sound.*
- [ ] **Finalize Session Log:** Patch the remaining UI quirks in the Master/Detail list layout.
- [ ] **Taxonomy Sweep:** Strip all dead code and obsolete inline time formatters. Enforce the global `timeUtils.ts` standard (`formatTimeOfDay`, `formatRelativeDate`, `formatDurationCompact`).
- [ ] **The Merge:** Pull the hardened Session Log module from the isolated `/demo` route into the `main` production branch.

## Phase 2: The DeepSession Timer Optimization (Performance)
*Ensure the core tracking engine survives aggressive mobile browser throttling.*
- [ ] **The JS Leak Fix:** Write strict lifecycle hooks (`useEffect` cleanup) to explicitly `clearInterval()` when the timer component is unmounted or minimized.
- [ ] **The "Low-Gear" Mode:** When the user switches tabs, drop the 1fps render loop. Shift to a 60-second background tick solely to update the browser's `document.title` (e.g., `(25:00) DeepSession`).
- [ ] **GPU Fallback:** Implement a zero-JS, pure CSS animation (like a pulsing haptic badge) for the minimized timer state to maintain visual awareness without waking up the JavaScript thread.

## Phase 3: The Native PWA Illusion (UI/UX)
*Strip away browser defaults to make the web app feel like a compiled native application.*
- [ ] **The App Shell:** Implement `h-[100dvh]` and `overflow-hidden` on the root body to prevent viewport shifting and native overscroll "bouncing."
- [ ] **Unified Codebase Routing:** Implement conditional rendering hooks to serve the Desktop Sidebar to large screens and the Material Design Bottom Navigation bar to mobile screens from the same codebase.
- [ ] **Web Resets:** Apply global CSS to disable user text-selection (`user-select: none`) on UI elements and kill the default blue tap-highlight boxes (`-webkit-tap-highlight-color: transparent`).
- [ ] **Hardware Hooks:** Integrate the `navigator.vibrate()` API for haptic feedback on timer starts/stops.
- [ ] **The Manifest:** Configure `manifest.json` with `"display": "standalone"` and a strict `"theme_color"` to merge the OS status bar with the app header.

## Phase 4: Dashboard & Filter Architecture (Feature Expansion)
*Expand the data interaction capabilities and optimize spatial density.*
- [ ] **The Split-Panel Dashboard:** Redesign the active tracker layout using the 50/50 Flexbox engine. Active Timer/Controls anchored on the left; an expansive, auto-saving Markdown Notes area on the right.
- [ ] **The Search & Filter Engine:** Build a high-performance query system for the Session Log. Must include input debouncing to protect the main thread and memoized dataset intersections.

## Phase 5: Frictionless Onboarding (The Product Pivot)
*Transition from a personal tool to a public product. Users must be able to test the app instantly without authenticating.*
- [ ] **The Data Abstraction Layer (Repository Pattern):** Decouple React components from direct database calls. Create a unified `SessionRepository` interface.
- [ ] **IndexedDB Guest Mode:** Implement a local storage engine using IndexedDB. Route data here if `user === null`.
- [ ] **The Seed Engine:** Write a script to instantly populate a new Guest instance with high-quality, realistic demo data (e.g., sessions tagged "#DSA", "#Freelance", complete with markdown notes) so the app feels alive immediately.

## Phase 6: Documentation & Ontology (Scaling)
*Map the intellectual framework of the application.*
- [ ] **Public README:** Draft the `README.md` focusing on the technical architecture, performance optimizations, and the problem DeepSession solves.
- [ ] **The Quest & Thread Ontology:** Document the overarching philosophy of the goal-tracking system so users understand *how* to use tags, sources, and activities effectively.

***
