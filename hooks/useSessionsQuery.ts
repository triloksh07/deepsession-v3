import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Session } from '@/types'; // Import our new shared type

// The async function that does the server work
const fetchSessions = async (userId: string): Promise<Session[]> => {
  // Query the 'sessions' collection
  const sessionsRef = collection(db, 'sessions');
  const q = query(
    sessionsRef,
    where('userId', '==', userId), // Get only this user's sessions
    orderBy('startTime', 'desc') // Get the newest ones first
  );

  const querySnapshot = await getDocs(q);
  
  // Map the Firestore documents to our Session type
  return querySnapshot.docs.map(doc => doc.data() as Session);
};

// The custom hook that our components will use
export const useSessionsQuery = () => {
  const user = auth.currentUser;
  
  return useQuery({
    // The query key: ['sessions', 'userId']
    // This caches the data based on the user
    queryKey: ['sessions', user?.uid],
    
    // The query function
    queryFn: () => fetchSessions(user!.uid),
    
    // Only run this query if the user is logged in
    enabled: !!user,
  });
};