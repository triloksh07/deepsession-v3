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
import logger from "@/lib/utils/logger"
import { logSessionsFetch } from '@/lib/logging';

// Helper to compare objects deeply
const isDataIdentical = (a: any[], b: any[]) => JSON.stringify(a) === JSON.stringify(b);

// ---------------------------
// Fetch function (1-time call)
// ---------------------------
export const fetchGoals = async (userId: string): Promise<Goal[]> => {
  if (!userId) {
    logger.error('useGoalsQuery: Aborted, no userId provided.');
    return [];
  }

  try {
    logger.info('useGoalsQuery: Attempting to fetch for userId:', userId);
    const goalsRef = collection(db, 'goals');
    const q = query(
      goalsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // ✅ KEY FIX 1: Read from Cache First (Instant)
    const querySnapshot = await getDocsFromCache(q);

    // 1. Calculate counts dynamically
    const fromCacheCount = querySnapshot.docs.filter(doc => doc.metadata.fromCache).length;
    const fromServerCount = querySnapshot.docs.length - fromCacheCount;

    const data = querySnapshot.docs.map(
      (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
      } as Goal)
    );

    // 2. Log with accurate metrics
    // Note: Changed source to 'fetch' (since this is the explicit fetcher, not the listener)
    logSessionsFetch({
      source: 'fetch',
      userId,
      count: data.length,
      fromCacheCount,   // Will be equal to total count when using getDocsFromCache
      fromServerCount,  // Will be 0 when using getDocsFromCache
    });

    logger.info('useSessionsQuery: Successfully fetched', data.length, 'Goals.');

    return data;
  } catch (error) {
    logger.warn('Goals cache fetch failed, waiting for snapshot');
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

        logger.info('useGoalsQuery: snapshot update', {
          count: newGoals.length,
          fromCacheSnapshot: snapshot.metadata.fromCache,
        });
      },
      (err) => {
        logger.error('onSnapshot error for goals:', err);
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
    // notifyOnChangeProps: ['data'],
  });
};
