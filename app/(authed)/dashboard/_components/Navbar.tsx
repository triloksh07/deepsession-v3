"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  Target,
  Clock,
  BarChart3,
  Download,
  User,
  Timer,
  LogOut,
  Menu,
  X,
  BrainCircuit
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ModeToggle } from '@/components/toggle-theme';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Logo } from "@/components/Logo";

export default function Navbar() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const navLinks = (
    <>
      <Link href="/dashboard/overview" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
        <Home className="w-5 h-5" /> <span>Dashboard</span>
      </Link>
      <Link href="/dashboard/goals" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
        <Target className="w-5 h-5" /> <span>Goals</span>
      </Link>
      <Link href="/dashboard/sessions" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
        <Clock className="w-5 h-5" /> <span>Sessions</span>
      </Link>
      <Link href="/dashboard/analytics" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
        <BarChart3 className="w-5 h-5" /> <span>Analytics</span>
      </Link>
      <Link href="/dashboard/export-data" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
        <Download className="w-5 h-5" /> <span>Export</span>
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 w-full border-b border-gray-200 dark:border-gray-700 bg-background z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: logo */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Link href="/dashboard/overview" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                <Logo className="text-primary" />

              </div>
              <span className="text-foreground font-bold text-lg tracking-tight">DeepSession</span>
            </Link>
          </div>

          {/* Center: desktop nav links */}
          <div className="hidden md:flex items-center space-x-4">{navLinks}</div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <ModeToggle />

            {/* user menu for desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden md:inline">{user?.displayName?.split(' ')[0] || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => { void handleLogout(); }}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <button
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileOpen((s) => !s)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className={`md:hidden mt-2 transition-max h-auto ${mobileOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
          <div className="flex flex-col gap-1 py-2">{navLinks}</div>
          <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
            <div className="px-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{user?.displayName?.split(' ')[0] || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
