// app/dashboard/DashboardLayoutWrapper.tsx
"use client";

import React from "react";
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation'

export default function DashboardLayoutWrapper({
    children
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
        if (user && !user.emailVerified) {
            router.push("/verify-email");
        }
    }, [user, loading, router]);
    // Handle loading state

    if(loading){
        return null;
    }
    if(!user){
        return <div>You must be logged in to view this page.</div>;
    }

    return ;
}
