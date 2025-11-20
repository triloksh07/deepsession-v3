'use client';
import Link from "next/link";
import {
    Home,
    Target,
    Clock,
    BarChart3,
    Download,
    Moon,
    User,
    Timer,
    LogOut
} from "lucide-react";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@//components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { ModeToggle } from '@/components/toggle-theme'
import {
    onAuthStateChanged,
    signOut,
    User as FirebaseUser, // Rename to avoid conflict
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Navigation() {

    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // NEW: Modern way to handle auth state changes with Firebase
    // --- Auth Listener ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // setIsLoading(false);
                setIsAuthReady(true); // <-- Set auth ready
            } else {
                setUser(null);
            }
            setIsLoading(false); // You already have this state
        });
        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };


    return (
        <nav className="border-b border-white/6 bg-black/40 backdrop-blur-sm">
            <div className="max-w-[1540px] mx-auto px-12 h-[67px] flex items-center justify-between">
                <div className="flex items-center gap-[262px]">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-[34px] h-[34px] rounded-[11px] bg-[#7F22FE] flex items-center justify-center">
                            <Clock className="w-[21px] h-[21px] text-white" strokeWidth={1.78} />
                        </div>
                        {/* <span className="text-white font-normal text-[17px] leading-[26px]">
                            DeepSession
                        </span> */}
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">DeepSession</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Smart Session Tracking</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard/overview"
                            className="flex items-center gap-2 px-4 py-2 rounded-[11px] bg-[#1E1E1E] text-white"
                        >
                            <Home className="w-[17px] h-[17px]" strokeWidth={1.43} />
                            <span className="text-[17px] leading-[26px]">Dashboard</span>
                        </Link>

                        <Link
                            href="/dashboard/goals"
                            className="flex items-center gap-2 px-4 py-2 rounded-[11px] text-[#A0A0A0] hover:bg-[#1E1E1E] hover:text-white transition-colors"
                        >
                            <Target className="w-[17px] h-[17px]" strokeWidth={1.43} />
                            <span className="text-[17px] leading-[26px]">Goals</span>
                        </Link>

                        <Link
                            href="/dashboard/sessions"
                            className="flex items-center gap-2 px-4 py-2 rounded-[11px] text-[#A0A0A0] hover:bg-[#1E1E1E] hover:text-white transition-colors"
                        >
                            <Clock className="w-[17px] h-[17px]" strokeWidth={1.43} />
                            <span className="text-[17px] leading-[26px]">Sessions</span>
                        </Link>

                        <Link
                            href="/dashboard/analytics"
                            className="flex items-center gap-2 px-4 py-2 rounded-[11px] text-[#A0A0A0] hover:bg-[#1E1E1E] hover:text-white transition-colors"
                        >
                            <BarChart3 className="w-[17px] h-[17px]" strokeWidth={1.43} />
                            <span className="text-[17px] leading-[26px]">Analytics</span>
                        </Link>

                        <Link
                            href="/dashboard/export-data"
                            className="flex items-center gap-2 px-4 py-2 rounded-[11px] text-[#A0A0A0] hover:bg-[#1E1E1E] hover:text-white transition-colors"
                        >
                            <Download className="w-[17px] h-[17px]" strokeWidth={1.43} />
                            <span className="text-[17px] leading-[26px]">Export</span>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">

                    <ModeToggle />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <User className="w-4 h-4 mr-2" />
                                <span className='hidden sm:inline'> {user?.displayName?.split(' ')[0] || 'User'}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="px-3 py-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
                                <p className="text-sm font-medium truncate flex flex-col">
                                    <span className='inline md:hidden'> {user?.displayName?.split(' ')[0] || 'User'}</span>
                                    <span>{user?.email}</span>
                                </p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>
        </nav>
    );
}