// hooks/useGoalsQuery.ts
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocsFromCache,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Goal } from '@/types';
import { devLog } from "@/lib/utils/logger"

// Helper to compare objects deeply
const isDataIdentical = (a: any[], b: any[]) => JSON.stringify(a) === JSON.stringify(b);

// ---------------------------
// Fetch function (1-time call)
// ---------------------------
export const fetchGoals = async (userId: string): Promise<Goal[]> => {
  if (!userId) {
    devLog.error('useGoalsQuery: Aborted, no userId provided.');
    return [];
  }

  try {
    devLog.info('useGoalsQuery: Attempting to fetch for userId:', userId);
    const goalsRef = collection(db, 'goals');
    const q = query(
      goalsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // ✅ KEY FIX 1: Read from Cache First (Instant)
    const querySnapshot = await getDocsFromCache(q);

    // let fromCacheCount = 0;
    // let fromServerCount = 0;

    // querySnapshot.docs.forEach((doc) => {
    //   if (doc.metadata.fromCache) fromCacheCount++;
    //   else fromServerCount++;
    // });

    const data = querySnapshot.docs.map(
      (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
      } as Goal)
    );

    // console.log(
    //   'useGoalsQuery: Successfully fetched',
    //   data.length,
    //   'goals.',
    //   { fromCacheCount, fromServerCount }
    // );

    return data;
  } catch (error) {
    console.warn('Goals cache fetch failed, waiting for snapshot');
    return [];
  }
};

// ---------------------------
// Custom hook (real-time + RQ)
// ---------------------------
export const useGoalsQuery = (userId: string | undefined, enabled: boolean) => {
  const qc = useQueryClient();
  const queryKey = ['goals', userId];

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
      { includeMetadataChanges: true },
      (snapshot) => {
        const newGoals = snapshot.docs.map(
          (doc) =>
          ({
            ...doc.data(),
            id: doc.id,
          } as Goal)
        );

        // ✅ KEY FIX 2: Deep compare to stop flash
        const currentGoals = qc.getQueryData<Goal[]>(queryKey);

        if (!currentGoals || !isDataIdentical(currentGoals, newGoals)) {
          qc.setQueryData<Goal[]>(queryKey, newGoals);
        }

        // qc.setQueryData<Goal[]>(['goals', userId], newGoals);

        console.log('useGoalsQuery: snapshot update', {
          count: newGoals.length,
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
    queryKey: queryKey,
    queryFn: () => fetchGoals(userId!), // initial fetch only – snapshot keeps cache fresh afterwards
    enabled: !!userId && enabled,
    staleTime: Infinity, // 1000 * 60 * 60, // 1 hour
    gcTime: Infinity, // 1000 * 60 * 60 * 24, // 24 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    notifyOnChangeProps: ['data'],
  });
};
