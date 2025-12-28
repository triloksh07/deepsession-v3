// hooks/useSessionsQuery.ts
import { useQuery, useQueryClient, } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, getDocsFromCache, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session } from '@/types';
import { useEffect } from 'react';
import { logSessionsFetch } from '@/lib/logging';
import type { QueryDocumentSnapshot } from 'firebase/firestore'

interface FirestoreSessionData {
    id: string;
    userId: string;
    title: string;
    session_type_id: string;
    notes?: string;
    started_at: string; // ISO String
    ended_at: string;  // ISO String
    total_focus_ms: number;
    total_break_ms: number;
    created_at?: Timestamp | '';
}

// helper that converts Firestore doc data -> Session (UI) model
const adaptDocToSession = (doc: any) => {
    const data = doc.data() as FirestoreSessionData;
    if (!data?.started_at || !data?.ended_at) return null;
    const startTime = new Date(data.started_at).getTime();
    const endTime = new Date(data.ended_at).getTime();
    if (isNaN(startTime) || isNaN(endTime)) return null;
    return {
        id: doc.id,
        title: data.title,
        type: data.session_type_id,
        notes: data.notes || '',
        sessionTime: data.total_focus_ms,
        breakTime: data.total_break_ms,
        startTime,
        endTime,
        date: new Date(startTime).toISOString().split('T')[0],
        // fromCache: doc.metadata.fromCache,
        // pending: doc.metadata.hasPendingWrites,
        // Optional: Track pending state for UI indicators
        // isPending: snapshot.metadata.hasPendingWrites 
    } as Session;
};

// ✅ CHANGED: This function now strictly reads from Local Cache 
// to avoid overwriting pending writes.
// The actual server data will arrive via the onSnapshot listener below.
export const fetchSessions = async (userId: string): Promise<Session[]> => {
    console.log('useSessionsQuery: Attempting to fetch from (onSnapshot):');
    if (!userId) return [];

    try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('userId', '==', userId), orderBy('started_at', 'desc'));
        const querySnapshot = await getDocsFromCache(q);
        // querySnapshot.docs.forEach(doc => console.log('Session data fromCache:', doc.metadata?.fromCache));

        let fromCacheCount = 0;
        let fromServerCount = 0;
        querySnapshot.docs.forEach((doc) => {
            if (doc.metadata.fromCache) fromCacheCount++;
            else fromServerCount++;
        });

        const sessions: Session[] = querySnapshot.docs
            .map(adaptDocToSession)
            .filter(Boolean) as Session[];

        // logging for debbuging
        logSessionsFetch({
            source: 'fetch',
            userId,
            count: sessions.length,
            fromCacheCount,
            fromServerCount,
        });

        console.log('useSessionsQuery: Successfully fetched', sessions.length, 'sessions.');
        return sessions;
    } catch (error) {
        console.error('useSessionsQuery: Error inside fetchSessions:', error);
        // throw error;
        // ✅ FIX: Return empty array instead of throwing
        // This allows React Query to show "success" state with 0 items
        // while onSnapshot fetches the real data in the background.
        return [];
    }
};

export const useSessionsQuery = (userId: string | undefined, enabled: boolean) => {
    const qc = useQueryClient();
    const queryKey = ['sessions', userId];

    // real-time listener
    useEffect(() => {
        if (!userId || !enabled) return;

        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('userId', '==', userId), orderBy('started_at', 'desc'));

        // This handles Initial Load + Offline Local + Online Sync
        const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
            // snapshot will return cached results immediately when offline
            const sessions = snapshot.docs.map(adaptDocToSession).filter(Boolean) as Session[];

            // This updates the UI with the "Merged View" (Server + Pending Local Writes)
            qc.setQueryData(queryKey, sessions);

            // for debugging
            logSessionsFetch({
                source: 'snapshot',
                userId,
                count: sessions.length,
                fromCacheSnapshot: snapshot.metadata.fromCache,
            });

        }, (err) => {
            console.error('onSnapshot error for sessions:', err);
        });

        return () => unsubscribe();
    }, [userId, enabled, qc]);

    return useQuery({
        queryKey: queryKey,
        // Query Function: Only runs on initial mount.
        // We use the "Cache Only" fetcher so we don't wipe pending data.
        // queryFn: () => fetchSessions(userId!),

        queryFn: () => {
            return qc.getQueryData<Session[]>(queryKey) || [];
        },

        enabled: !!userId && enabled,
        staleTime: Infinity, // 1000 * 60 * 60, // 1 hour
        gcTime: Infinity, // 1000 * 60 * 60 * 48, // 24 hours
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false, // Critical: Don't refetch on network restore
        retry: 1,
        networkMode: 'offlineFirst',
        // 🔑 IMPORTANT: sirf data change pe re-render
        // notifyOnChangeProps: ['data'],
    });
};
