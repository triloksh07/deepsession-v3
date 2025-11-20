'use client'

import React, { useEffect } from 'react';
import DashboardProvider from './_components/DashboardProvider';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { Skeleton as SkeletonBlock } from '@/components/ui/skeleton';

// Simple ErrorBoundary for catching render-time errors inside the dashboard shell
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown, info: unknown) {
    // log to monitoring here if you have one
    console.error('Dashboard ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">Try refreshing the page.</p>
        </div>
      );
    }
    // ✅ return children directly, no cast needed
    // return this.props.children as React.ReactElement;
    return this.props.children;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // keep redirect logic but don't block initial render
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // if user exists, route to onboarding/verify or overview accordingly
    if (user?.emailVerified) {
      // only push if already not on overview - optional
      // router.push('/dashboard/overview');
    } else {
      // router.push('/verify-email');
    }
  }, [user, loading, router]);

  // Show a centered skeleton while auth is initializing to avoid layout flash.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-xl p-6">
          <SkeletonBlock className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  // When user is not present (not authenticated) return null to avoid content flash.
  // The effect above will handle the redirect to /login once loading completes.
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar renders immediately (client) as part of the protected shell */}
      {/* <Navbar /> */}

      {/* DashboardProvider supplies pre-fetched sessions/goals to the subtree */}
      <DashboardProvider userId={user.uid}>
        {/* ErrorBoundary catches runtime errors inside pages so app doesn't crash */}
        <ErrorBoundary>
          <main className="container mx-auto p-6 max-w-7xl">{children}</main>
        </ErrorBoundary>
      </DashboardProvider>
    </div>
  );
}

/*
Notes:
- This layout is a client component because it needs to read client-only auth state (firebase) and run redirects.
- Returning `null` when there is no user (and not loading) prevents a flash of protected content while the router pushes to /login.
- The loading skeleton avoids visual jank during the onAuthStateChanged check.
- Pages inside this layout should use Suspense and their own fallbacks for data loading; this layout provides the auth-protected shell only.
*/
