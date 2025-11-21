// /context/AuthProvider.tsx
// (offline-friendly)
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { setPersistence, browserLocalPersistence } from 'firebase/auth'
import { useSyncActiveSession } from "@/hooks/useSyncActiveSession";
import { useQueryClient } from '@tanstack/react-query';
import { fetchSessions } from '@/hooks/useSessionsQuery';
import { fetchGoals } from '@/hooks/useGoalsQuery';

// Small helper to detect client
const isClient = typeof window !== 'undefined';

type AuthContextType = {
    user: FirebaseUser | null;
    loading: boolean;
};

// ✅ Create context with type
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    // We must ensure this hook only runs *after* the user is set.
    // (user?.uid is undefined initially)
    const [isAuthReady, setIsAuthReady] = useState(false);

    // Ensure persistence is configured before any auth operations.
    useEffect(() => {
        if (!isClient) return;
        // call once, non-blocking
        setPersistence(auth, browserLocalPersistence)
            .then(() => console.log('Auth persistence set: browserLocalPersistence'))
            .catch((err) => console.error('Failed to set auth persistence', err));
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsAuthReady(true);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);


    // --- PREFETCHING: prime TanStack Query cache for offline-first UX ---
    useEffect(() => {
        if (!user?.uid) return;

        (async () => {
            console.log('User logged in. Pre-fetching data for offline use...');
            try {
                // prefetch sessions - set a long staleTime so components don't refetch on mount
                await queryClient.prefetchQuery({
                    queryKey: ['sessions', user.uid],
                    queryFn: () => fetchSessions(user.uid),
                    // store fetched data in cache with a long staleTime to avoid unnecessary refetches
                    staleTime: 1000 * 60 * 60, // 1 hour
                    gcTime: 1000 * 60 * 60 * 24, // 24 hours
                });
                console.log('Prefetched sessions successfully');
            } catch (err) {
                console.error('Prefetch sessions failed (non-blocking):', err);
            }

            try {
                await queryClient.prefetchQuery({
                    queryKey: ['goals', user.uid],
                    queryFn: () => fetchGoals(user.uid),
                    staleTime: 1000 * 60 * 60,
                    gcTime: 1000 * 60 * 60 * 24,
                });
                console.log('Prefetched goals successfully');
            } catch (err) {
                console.error('Prefetch goals failed (non-blocking):', err);
            }

        })();

    }, [user?.uid, queryClient]);

  // real-time sync hook — 
  // it handles active session syncing and cross-device updates
    useSyncActiveSession(isAuthReady ? user : null);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// ✅ Hook with proper typing
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
