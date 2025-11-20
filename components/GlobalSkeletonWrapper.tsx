// app/_components/SkeletonWrapper.tsx
'use client';

import React from 'react';
import { SkeletonWrapper as RSkeletonWrapper } from 'react-skeletonify';

interface SkeletonWrapperProps {
  children: React.ReactNode;
  isLoading: boolean;
  baseColor?: string;
  highlightColor?: string;
  duration?: number;
}

export default function SkeletonWrapper({
  children,
  isLoading,
  baseColor = '#e5e7eb', // Tailwind gray-200
  highlightColor = '#f3f4f6', // Tailwind gray-100
  duration = 1.2,
}: SkeletonWrapperProps) {
  if (isLoading) {
    return (
      <RSkeletonWrapper
      loading={isLoading}
      >
        {children}
      </RSkeletonWrapper>
    );
  }
  return <>{children}</>;
}
