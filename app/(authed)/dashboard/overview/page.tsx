// app/(authed)/dashboard/overview/page.tsx
'use client';
import React from 'react';
import { Suspense } from 'react';
import SessionTracker from '@/app/(authed)/dashboard/_components/PipSessionTracker';
import Loading from './loading';
import DashboardContent from "../_components/DashboardContent"
// import ThreadVisualizer from '@/app/(authed)/dashboard/_components/ThreadVisualizer';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* SSR Shell */}
      <div className="text-center space-y-4">
        <SessionTracker />
      </div>

      {/* Suspense boundary for data-dependent content */}
      <Suspense fallback={<Loading />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
