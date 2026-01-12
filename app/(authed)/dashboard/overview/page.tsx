// app/(authed)/dashboard/overview/page.tsx
'use client';
import React from 'react';
import { Suspense } from 'react';
import { Session } from '@/types';
import SessionTracker from '@/app/(authed)/dashboard/_components/sessionTracker';
import SkeletonWrapper from "../_components/SkeletonWrapper";
import { DashboardOverviewSkeleton } from '../_components/LoadingFallbacks';
import Loading from './loading';
import DashboardContent from "../_components/DashboardContent"


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
