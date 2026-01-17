// hooks/useSessionsQuery.ts
import { useQuery, useQueryClient, } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocsFromCache, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session } from '@/types';
import { useEffect } from 'react';
import { logSessionsFetch } from '@/lib/logging';
import type { QueryDocumentSnapshot } from 'firebase/firestore'
import { devLog } from '@/lib/utils/logger';

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

// Helper: Normalize Timestamps to primitives to ensure JSON.stringify stability
const normalizeDate = (date: any): number | null => {
    if (!date) return null;
    if (typeof date === 'number') return date; // Already a timestamp
    if (typeof date === 'string') return new Date(date).getTime(); // ISO String
    // if (date?.toMillis) return date.toMillis(); // Firestore Timestamp
    if (date instanceof Date) return date.getTime(); // JS Date
    return null;
};

// Helper to compare objects deeply
const isDataIdentical = (a: any[], b: any[]) => JSON.stringify(a) === JSON.stringify(b);

// Helper Firestore doc -> Session (UI) model
const adaptDocToSession = (doc: any) => {
    const data = doc.data() as FirestoreSessionData;
    if (!data?.started_at || !data?.ended_at) return null;

    // const startTime = new Date(data.started_at).getTime();
    // const endTime = new Date(data.ended_at).getTime();

    // Normalize times to strictly numbers (Epoch MS)
    const startTime = normalizeDate(data.started_at);
    const endTime = normalizeDate(data.ended_at);

    if (!startTime || !endTime) return null;
    // if (isNaN(startTime) || isNaN(endTime)) return null;

    return {
        id: doc.id,
        title: data.title || '',
        type: data.session_type_id,
        notes: data.notes || '',
        sessionTime: Number(data.total_focus_ms),
        breakTime: Number(data.total_break_ms),
        startTime,
        endTime,
        date: new Date(startTime).toISOString().split('T')[0],
        // Note: We deliberately exclude metadata fields to ensure
        // JSON.stringify works correctly for comparison.
    } as Session;
};

// Fetcher: Reads strictly from Local Cache first (Instant Resume)
export const fetchSessions = async (userId: string): Promise<Session[]> => {

    if (!userId) return [];

    try {
        devLog.info("useSessionsQuery: Attempting to fetch from (onSnapshot):");
        devLog.debug({ query: "sessions", status: "pending" });

        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('userId', '==', userId), orderBy('started_at', 'desc'));

        const querySnapshot = await getDocsFromCache(q);

        // let fromCacheCount = 0;
        // let fromServerCount = 0;
        // querySnapshot.docs.forEach((doc) => {
        //     if (doc.metadata.fromCache) fromCacheCount++;
        //     else fromServerCount++;
        // });

        const sessions: Session[] = querySnapshot.docs
            .map(adaptDocToSession)
            .filter(Boolean) as Session[];

        // logging for debbuging
        logSessionsFetch({
            source: 'fetch',
            userId,
            count: sessions.length,
            fromCacheCount: sessions.length,
            fromServerCount: 0,
        });

        devLog.info('useSessionsQuery: Successfully fetched', sessions.length, 'sessions.');

        return sessions;
    } catch (error) {
        console.warn('Cache fetch failed (likely empty), waiting for snapshot:', error);
        return [];
    }
};

export const useSessionsQuery = (userId: string | undefined, enabled: boolean) => {
    const qc = useQueryClient();
    const queryKey = ['sessions', userId];

    // Real-time listener for updates (Sync & Pending Writes)
    useEffect(() => {
        if (!userId || !enabled) return;

        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('userId', '==', userId), orderBy('started_at', 'desc'));

        // This handles Initial Load + Offline Local + Online Sync
        const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
            // snapshot will return cached results immediately when offline
            const newSessions = snapshot.docs.map(adaptDocToSession).filter(Boolean) as Session[];

            // ✅ OPTIMIZATION: Deep Compare to prevent re-renders on metadata changes
            // When a write goes from 'pending' to 'synced', the data fields don't change.
            // We shouldn't update the cache in that case.
            const currentSessions = qc.getQueryData<Session[]>(queryKey);

            // ✅ Debug Log: Check if this logic is actually saving us
            const isSame = isDataIdentical(currentSessions || [], newSessions);

            // if (!currentSessions || !isDataIdentical(currentSessions, newSessions)) {
            //     qc.setQueryData(queryKey, newSessions);

            //     logSessionsFetch({
            //         source: 'snapshot_update',
            //         userId,
            //         count: newSessions.length,
            //         fromCacheSnapshot: snapshot.metadata.fromCache,
            //     });
            // }

            if (!isSame) {
                console.log(`[Snapshot Update] Data changed. (FromCache: ${snapshot.metadata.fromCache})`);
                // Optional: Log strict diff if needed for debugging
                console.log('Diff:', newSessions[0], currentSessions?.[0]); 
                qc.setQueryData(queryKey, newSessions);
            } else {
                console.log('[Snapshot Update] Skipped re-render (Data identical)');
            }
        }, (err) => {
            console.error('onSnapshot error for sessions:', err);
        });

        return () => unsubscribe();
    }, [userId, enabled, qc]);

    return useQuery({
        queryKey: queryKey,
        queryFn: () => fetchSessions(userId!),
        enabled: !!userId && enabled,

        // Cache Settings for Offline-First
        staleTime: Infinity, // 1000 * 60 * 60, // 1 hour
        gcTime: Infinity, // 1000 * 60 * 60 * 48, // 24 hours

        // Critical: Prevent network fetches from interfering with onSnapshot
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false, // Critical: Don't refetch on network restore
        // retry: 1,

        // networkMode: 'offlineFirst',
        // Only re-render if the actual data array changes
        notifyOnChangeProps: ['data'],
    });
};
