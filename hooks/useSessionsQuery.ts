// hooks/useSessionsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Session } from '@/types';

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
}

// The async function that does the server work
export const fetchSessions = async (userId: string): Promise<Session[]> => {
  console.log("useSessionsQuery: Attempting to fetch for userId:", userId);

  if (!userId) {
    console.error("useSessionsQuery: Aborted, no userId provided.");
    return [];
  }

  try {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('started_at', 'desc')
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.docs.forEach(doc => {
      console.log("Session data from cache: " , doc.metadata.fromCache); // true if served from local cache
    });
    const sessions: Session[] = querySnapshot.docs
      .map(doc => {
        const data = doc.data() as FirestoreSessionData;
        // 2. We keep this check, it's good practice
        if (!data.started_at || !data.ended_at) {
          console.warn("Skipping session, missing timestamp:", data.id);
          return null;
        }

        // --- VALIDATION ---
        const startTime = new Date(data.started_at).getTime();
        const endTime = new Date(data.ended_at).getTime();

        if (isNaN(startTime) || isNaN(endTime)) {
          console.warn("Skipping session, invalid date format:", data.id, data.started_at, data.ended_at);
          return null;
        }
        return {
          id: doc.id,
          title: data.title,
          type: data.session_type_id,
          notes: data.notes || '',
          sessionTime: data.total_focus_ms,
          breakTime: data.total_break_ms,
          startTime: startTime,
          endTime: endTime,
          date: new Date(startTime).toISOString().split('T')[0],
        } as Session; //--- new ---
      })
      .filter(Boolean) as Session[];
      // .filter(session => session !== null) as Session[]; // Filter out bad data

    console.log("useSessionsQuery: Successfully fetched", sessions.length, "sessions.");
    return sessions;

  } catch (error) {
    console.error("useSessionsQuery: Error *inside* fetchSessions:", error);
    throw error;
  }
};

// The custom hook that our components will use
export const useSessionsQuery = (
  userId: string | undefined,
  enabled: boolean
) => {

  return useQuery({
    // The query key: ['sessions', 'userId']
    // This caches the data based on the user
    queryKey: ['sessions', userId],
    queryFn: () => fetchSessions(userId!),
    enabled: enabled,
    staleTime: 1000 * 60 * 60, // 1 hour - prevents refetch on remount
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};