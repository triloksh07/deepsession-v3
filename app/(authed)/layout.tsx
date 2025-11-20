// app/(authed)/layout.tsx — THIN SERVER LAYOUT
// Purpose: export metadata (SEO) from a server component while delegating
// client-only auth/UI to the existing client layout at
// app/(authed)/dashboard/layout.tsx

// This file is a server component (no "use client") and should live at
// app/(authed)/layout.tsx. It provides page metadata for SEO and then
// mounts the client-only dashboard shell.

import type { Metadata } from 'next'
import DashboardClientLayout from './dashboard/layout' // <- client layout (already created)
import Navbar from './dashboard/_components/Navbar3';

export const metadata: Metadata = {
  title: 'DeepSession — Dashboard',
  description: 'Your personal productivity dashboard. Track sessions, goals and analytics.',
  openGraph: {
    title: 'DeepSession — Dashboard',
    description: 'Your personal productivity dashboard. Track sessions, goals and analytics.',
    type: 'website',
  },
  // Add other SEO fields here (twitter, icons, alternates, etc.) as needed
}

export default function AuthedServerLayout({ children }: { children: React.ReactNode }) {
  // This server layout is intentionally thin: it only provides metadata and
  // mounts the client layout (which handles auth, redirects, and client state).
  // Keeping metadata here ensures SSR SEO while giving the client layout full
  // control over protected UI.

  // Render the client layout which will read client-side auth and render the app shell
  return (
    <>
      <Navbar />
      <DashboardClientLayout>
        {children}
      </DashboardClientLayout>
    </>
  );
}

/*
Notes / Usage
- Place this file at: app/(authed)/layout.tsx
- Ensure the client-only layout lives at: app/(authed)/dashboard/layout.tsx (the file we already created)
- Because metadata is exported from a server component, Next.js can render correct
  <head> tags for SEO and previews.
- Keep this file minimal — any heavy client logic must remain inside the client
  layout so the server layout stays fast and cacheable.
- If you need per-page dynamic metadata (e.g., user-specific titles), generate
  those server-side in higher-level server routes / API and consume them here.
*/
