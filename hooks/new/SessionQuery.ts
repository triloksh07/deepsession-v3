// hooks/useSessionsQuery.ts
import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session } from '@/types';

interface FirestoreSessionData {
  id: string;
  userId: string;
  title: string;
  session_type_id: string;
  notes?: string;
  started_at: string; // ISO String
  ended_at: string;   // ISO String
  total_focus_ms: number;
  total_break_ms: number;
}

export const useSessionsQuery = (userId: string | undefined, enabled: boolean) => {
  const queryClient = useQueryClient();
  console.log("useSessionsQuery: Attempting to fetch for userId:", userId);

  // React Query setup (no queryFn, we’ll hydrate manually)
  const queryResult = useQuery<Session[]>({
    queryKey: ['sessions', userId],
    queryFn: async () => [], // placeholder, we’ll override via onSnapshot
    enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (!userId || !enabled) return;

    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('started_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions: Session[] = snapshot.docs
        .map((doc) => {
          const data = doc.data() as FirestoreSessionData;
          console.log("Session data inside onSnapshot function retrieved from cache: ", doc.metadata.fromCache); // true if served from local cache
          if (!data.started_at || !data.ended_at) {
            console.warn("Skipping session, missing timestamp:", data.id);
            return null;
          };

          const startTime = new Date(data.started_at).getTime();
          const endTime = new Date(data.ended_at).getTime();
          if (isNaN(startTime) || isNaN(endTime)) {
            console.warn("Skipping a session doc, invalid date format:", data.id, data.started_at, data.ended_at);
            return null;
          }

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
            // 🔑 Pending write awareness
            fromCache: snapshot.metadata.fromCache,
            pending: doc.metadata.hasPendingWrites,
          } as Session & { fromCache: boolean; pending: boolean };
        })
        .filter(Boolean) as Session[];

      console.log("useSessionsQuery: Successfully fetched", sessions.length, "sessions.");
      // Hydrate React Query cache
      queryClient.setQueryData(['sessions', userId], sessions);
    });

    return () => unsubscribe();
  }, [userId, enabled, queryClient]);

  return queryResult;
};
