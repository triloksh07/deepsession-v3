'use client'
import React from "react";
import { Suspense } from 'react';
import { useEffect } from 'react'
import Navbar from './_components/Navbar2';
import DashboardProvider from "./_components/DashboardProvider";
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation'
import { DashboardContent } from "./overview/page"
// export const metadata = { title: 'DeepSession' };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
    }
    if (user?.emailVerified) {
      router.push("/dashboard/overview");
    } else {
      router.push('/verify-email')
    }
  }, [user, loading, router]);

  if (!user) {
    return (
      null
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DashboardProvider userId={user.uid}>
        <main className='container mx-auto p-6 max-w-7xl'>{children}</main>
      </DashboardProvider>
    </div>
  )
}