## **DeepSession v2**
DeepSession v2 is a modern, offline-first, and cross-device-syncing web application for tracking and analyzing deep work sessions.

This project evolves the v0 (MVP) architecture from a single-device, localStorage-based timer to a robust, scalable, and real-time application. It introduces a sophisticated state management system that cleanly separates server state (TanStack Query) from live client state (Zustand) and syncs them via Firestore.

## ✨ Core Features

- True Offline-First Timer: Start, pause, break, and end sessions with zero internet connection. All operations are written to Firebase's local cache and sync automatically when you reconnect [cite: lib/firebase.js, store/sessionStore.ts].

- Real-Time Cross-Device Sync: Start a timer on your desktop and watch it tick live on your phone. The active session is synced in real-time across all your logged-in devices [cite: hooks/useSyncActiveSession.ts].

- Robust Timer Engine: Built on the high-performance requestAnimationFrame-based timer from v0 (lib/PersistentTimer.ts) to ensure accurate time tracking without UI lag.

- Hybrid Authentication: Secure login with Email/Password, Google, or GitHub, all managed via Firebase Auth [cite: components/Auth.tsx].

- v0 Data Compatibility: Reads and correctly adapts all session data from the v0 database, ensuring a seamless upgrade for existing users [cite: hooks/useSessionsQuery.ts].

- Server-Side State with TanStack Query: All server data (finished sessions, goals) is managed by TanStack Query, providing caching, automatic refetching, and an optimistic UI.

- Goal Tracking: Full CRUD (Create, Read, Update, Delete) functionality for daily, weekly, and monthly focus goals.

- PWA Installable: Includes a manifest and service worker for a native-like, installable app experience [cite: public/manifest.json].

- Analytics Dashboard: A tab-based dashboard with charts (via Recharts) to visualize your work patterns over time [cite: components/Analytics.tsx].

## 🚀 Architecture & Tech Stack

- The architecture of v2 is designed for a clean separation of concerns, scalability, and a robust offline-first, real-time user experience.

**Framework: Next.js (App Router)**

- **UI:** React & TypeScript

- **Styling:** Tailwind CSS & shadcn/ui

- **Backend & Database:** Firebase (Authentication & Firestore)

- **Charts:** Recharts

- **State Management:** A 3-Layer Hybrid Model

## **This app's state is managed in three distinct layers, each with a specific job:**

## Server State (TanStack Query):

- **Job:** Manages all lists of server-side data.

- **How:** Custom hooks like useSessionsQuery and useGoalsQuery use TanStack Query to fetch, cache, and serve all finished sessions and all goals.

- **Mutations:** Hooks like useCreateSession [cite: hooks/useCreateSession.ts] and useGoalMutations use TanStack's useMutation to handle creating/updating this data, with background retries.

## Live Client State (Zustand):

- **Job:** Manages the single, currently-active timer.

- **How:** A central Zustand store (store/sessionStore.ts) holds the state of the live session (e.g., isActive, onBreak, startTime). This provides an instant, optimistic UI.

## Real-time & Offline Sync (Firebase):

**Job:** This is the "glue" that syncs the Zustand store (Client) with Firestore (Server).

**How:**

**Offline-First:** The Zustand store's actions (startSession, toggleBreak) are async and call setDoc or updateDoc directly [cite: store/sessionStore.ts]. Because lib/firebase.js enables persistentLocalCache, these writes succeed instantly offline by writing to the local cache.

**Cross-Sync:** A hook, useSyncActiveSession [cite: hooks/useSyncActiveSession.ts], uses onSnapshot to listen to a specific document (active_sessions/{userId}). When this doc changes (either from the local cache or another device), it pushes the new data into the Zustand store, syncing the UI everywhere.

## 🏁 Getting Started

1. Environment Variables

Create a .env.local file in the root of the project and add your Firebase project configuration:
```env
NEXT_PUBLIC_API_KEY=...
NEXT_PUBLIC_AUTH_DOMAIN=...
NEXT_PUBLIC_PROJECT_ID=...
NEXT_PUBLIC_STORAGE_BUCKET=...
NEXT_PUBLIC_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_APP_ID=...
NEXT_PUBLIC_MEASUREMENT_ID=...
```

2. Set Up Firebase

Enable Authentication: In your Firebase project, enable the Email/Password, Google, and GitHub sign-in providers.

Enable Firestore: Create a Firestore database.

Set Up Security Rules: You must add rules to allow users to read/write their own data.
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can manage their own *finished* sessions
    match /sessions/{sessionId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Users can manage their own goals
    match /goals/{goalId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Users can only manage their *own* single active session
    match /active_sessions/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Create Indexes:** You must create two composite indexes for your queries to work:

- Index 1 (Sessions):

  Collection: sessions

  Field 1: userId (Ascending)

  Field 2: started_at (Descending)

- Index 2 (Goals):

  Collection: goals

  Field 1: userId (Ascending)

  Field 2: createdAt (Descending)

**3. Install Dependencies and Run**

This project uses pnpm [cite: pnpm-lock.yaml].

## Install dependencies
```
pnpm install
```
## Run the development server (with Turbopack)
```
pnpm dev
```