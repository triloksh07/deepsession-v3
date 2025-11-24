// hooks/useGoalsQuery.ts
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Goal } from '@/types';

// ---------------------------
// Fetch function (1-time call)
// ---------------------------
export const fetchGoals = async (userId: string): Promise<Goal[]> => {
  console.log('useGoalsQuery: Attempting to fetch for userId:', userId);
  if (!userId) {
    console.error('useGoalsQuery: Aborted, no userId provided.');
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

    let fromCacheCount = 0;
    let fromServerCount = 0;

    querySnapshot.docs.forEach((doc) => {
      if (doc.metadata.fromCache) fromCacheCount++;
      else fromServerCount++;
    });

    const data = querySnapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
        } as Goal)
    );

    console.log(
      'useGoalsQuery: Successfully fetched',
      data.length,
      'goals.',
      { fromCacheCount, fromServerCount }
    );

    return data;
  } catch (error) {
    console.error('useGoalsQuery: Error *inside* fetchGoals:', error);
    throw error;
  }
};

// ---------------------------
// Custom hook (real-time + RQ)
// ---------------------------
export const useGoalsQuery = (userId: string | undefined, enabled: boolean) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId || !enabled) return;

    const goalsRef = collection(db, 'goals');
    const q = query(
      goalsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const goals = snapshot.docs.map(
          (doc) =>
            ({
              ...doc.data(),
              id: doc.id,
            } as Goal)
        );

        qc.setQueryData<Goal[]>(['goals', userId], goals);

        console.log('useGoalsQuery: snapshot update', {
          count: goals.length,
          fromCacheSnapshot: snapshot.metadata.fromCache,
        });
      },
      (err) => {
        console.error('onSnapshot error for goals:', err);
      }
    );

    return () => unsubscribe();
  }, [userId, enabled, qc]);

  return useQuery({
    queryKey: ['goals', userId],
    // initial fetch only – snapshot keeps cache fresh afterwards
    queryFn: () => fetchGoals(userId!),
    enabled: !!userId && enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};
