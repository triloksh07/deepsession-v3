// app/(authed)/dashboard/_components/LoadingFallbacks.tsx
'use client';

import React from 'react';
import SkeletonWrapper from './SkeletonWrapper';

export function DashboardOverviewSkeleton() {
  // Render the same structure as DashboardContent but wrapped in SkeletonWrapper
  return (
    <SkeletonWrapper isLoading={true}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="h-24 w-full rounded-md bg-gray-200" />
          <div className="h-24 w-full rounded-md bg-gray-200" />
          <div className="h-24 w-full rounded-md bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-40 w-full rounded-md bg-gray-200" />
          <div className="h-40 w-full rounded-md bg-gray-200" />
        </div>
      </div>
    </SkeletonWrapper>
  );
}
