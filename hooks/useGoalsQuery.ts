// hooks/useGoalsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Goal } from '@/types';

// The async function that does the server work
export const fetchGoals = async (userId: string): Promise<Goal[]> => {
  console.log("useGoalsQuery: Attempting to fetch for userId:", userId);
  if (!userId) {
    console.error("useGoalsQuery: Aborted, no userId provided.");
    return [];
  }

  try {
    const goalsRef = collection(db, 'goals');
    const q = query(
      goalsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.docs.forEach(doc => {
      console.log("Goals data from cache: " , doc.metadata.fromCache); // true if served from local cache
    });
    
    const data = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }) as Goal);
    console.log("useGoalsQuery: Successfully fetched", data.length, "goals.");
    return data;
  } catch (error) {
    console.error("useGoalsQuery: Error *inside* fetchGoals:", error);
    throw error;
  }
};

// The custom hook that our components will use
export const useGoalsQuery = (userId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['goals', userId],
    queryFn: () => fetchGoals(userId!),
    enabled: enabled,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};