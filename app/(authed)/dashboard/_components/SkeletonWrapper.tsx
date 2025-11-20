'use client';

import React from 'react';
import { SkeletonWrapper as RSkeletonWrapper } from 'react-skeletonify';

interface Props {
  children: React.ReactNode;
  isLoading: boolean;
  // optional: customize skeleton appearance globally
  skeletonProps?: {
    baseColor?: string;
    highlightColor?: string;
    duration?: number;
  };
}

export default function SkeletonWrapper({ children, isLoading, skeletonProps }: Props) {
  if (isLoading) {
    return (
      <RSkeletonWrapper loading={isLoading} {...skeletonProps}>
        {children}
      </RSkeletonWrapper>
    );
  }
  return <>{children}</>;
}
