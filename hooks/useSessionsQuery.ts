import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Session } from '@/types'; // Import our new shared type

// The data model as it exists in your v0 Firestore
interface FirebaseSessionData {
  id: string;
  userId: string;
  title: string;
  type: string;
  notes?: string;
  started_at: Timestamp; // It's a Timestamp object
  ended_at: Timestamp;   // It's a Timestamp object
  duration: number;
  break_duration: number;
}

// The async function that does the server work
// const fetchSessions = async (userId: string): Promise<Session[]> => {
//   // Query the 'sessions' collection
//   const sessionsRef = collection(db, 'sessions');
//   const q = query(
//     sessionsRef,
//     where('userId', '==', userId), // Get only this user's sessions
//     orderBy('startTime', 'desc') // Get the newest ones first
//   );

//   const querySnapshot = await getDocs(q);

//   // Map the Firestore documents to our Session type
//   return querySnapshot.docs.map(doc => doc.data() as Session);
// };
// const fetchSessions = async (userId: string): Promise<Session[]> => {
//   // --- ADD THIS LOG ---
//   console.log("useSessionsQuery: Attempting to fetch for userId:", userId);

//   if (!userId) {
//     console.error("useSessionsQuery: Aborted, no userId provided.");
//     return [];
//   }

//   // --- ADD THIS TRY...CATCH ---
//   try {
//     const sessionsRef = collection(db, 'sessions');
//     const q = query(
//       sessionsRef,
//       where('userId', '==', userId),
//       orderBy('startTime', 'desc')
//     );

//     const querySnapshot = await getDocs(q);
//     const data = querySnapshot.docs.map(doc => doc.data() as Session);

//     // --- ADD THIS LOG ---
//     console.log("useSessionsQuery: Successfully fetched", data.length, "sessions.");
//     return data;

//   } catch (error) {
//     // --- ADD THIS LOG ---
//     console.error("useSessionsQuery: Error *inside* fetchSessions:", error);
//     throw error; // Re-throw the error so TanStack Query can catch it
//   }
// };

const fetchSessions = async (userId: string): Promise<Session[]> => {
  console.log("useSessionsQuery: Attempting to fetch for userId:", userId);
  try {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('started_at', 'desc') // <-- 2. Query v0 field
    );

    const querySnapshot = await getDocs(q);

    // --- 3. THIS IS THE ADAPTER ---
    // Convert v0 data (FirebaseSessionData) into v2 UI data (Session)
    const sessions = querySnapshot.docs.map(doc => {
      const data = doc.data() as FirebaseSessionData;

      return {
        id: data.id, // Use the v0 string ID
        title: data.title,
        type: data.type,
        notes: data.notes || '',

        // Convert Timestamps to numbers (milliseconds)
        started_at: data.started_at.toMillis(),
        ended_at: data.ended_at.toMillis(),

        // Use v0's pre-calculated durations
        sessionTime: data.duration,
        breakTime: data.break_duration,

        // Create the date string for the UI
        date: new Date(data.started_at.toMillis()).toISOString().split('T')[0]
      };
    });

    console.log("useSessionsQuery: Successfully fetched and adapted", sessions.length, "sessions.");
    return sessions;

  } catch (error) {
    console.error("useSessionsQuery: Error *inside* fetchSessions:", error);
    throw error;
  }
};

// --- THIS IS THE CHANGE ---
// We now accept userId as an argument

// The custom hook that our components will use
export const useSessionsQuery = (userId: string | undefined) => {
  // const user = auth.currentUser;

  return useQuery({
    // The query key: ['sessions', 'userId']
    // This caches the data based on the user
    queryKey: ['sessions', userId],

    // The query function
    queryFn: () => fetchSessions(userId!),

    // Only run this query if the user is logged in
    enabled: !!userId,
  });
};