import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  orderBy,
  getDocsFromCache,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tag, TagCategory } from '@/types';
import logger from '@/lib/utils/logger';

// Helper Firestore doc -> Tag (UI) model
const adaptDocToTag = (doc: any): Tag => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    name: data.name || '',
    category: data.category as TagCategory,
    color: data.color || undefined,
    isArchived: data.isArchived || false,
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
  };
};

const isDataIdentical = (a: any[], b: any[]) => JSON.stringify(a) === JSON.stringify(b);

// Fetcher: Reads strictly from Local Cache first
export const fetchTags = async (userId: string): Promise<Tag[]> => {
  if (!userId) return [];

  try {
    logger.info("useTagsQuery: Attempting to fetch from cache...");

    const tagsRef = collection(db, 'tags');
    const q = query(tagsRef, where('userId', '==', userId), orderBy('name', 'asc'));

    const querySnapshot = await getDocsFromCache(q);

    const tags: Tag[] = querySnapshot.docs.map(adaptDocToTag).filter(Boolean);

    logger.info('useTagsQuery: Successfully fetched', tags.length, 'tags from cache.');
    return tags;
  } catch (error) {
    // CRITICAL FIX: Do not throw here. Return empty array to allow Snapshot to take over.
    logger.warn('Cache fetch failed for tags (likely empty), waiting for snapshot.');
    return [];
  }
};

export const useTagsQuery = (userId: string | undefined, enabled: boolean = true) => {
  const qc = useQueryClient();
  const queryKey = ['tags', userId];

  useEffect(() => {
    if (!userId || !enabled) return;

    const tagsRef = collection(db, 'tags');
    const q = query(tagsRef, where('userId', '==', userId), orderBy('name', 'asc'));

    // CRITICAL FIX: Added includeMetadataChanges: true
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
        const newTags = snapshot.docs.map(adaptDocToTag).filter(Boolean);

        const currentTags = qc.getQueryData<Tag[]>(queryKey);
        const isSame = isDataIdentical(currentTags || [], newTags);

        if (!isSame) {
          logger.debug(`[Snapshot Update] Tags changed. (FromCache: ${snapshot.metadata.fromCache})`);
          qc.setQueryData<Tag[]>(queryKey, newTags);
        } else {
          logger.debug('[Snapshot Update] Skipped re-render (Tags identical)');
        }
      },
      (err) => {
        logger.error('onSnapshot error for tags:', err);
      }
    );

    return () => unsubscribe();
  }, [userId, enabled, qc]);

  return useQuery({
    queryKey: queryKey,
    queryFn: () => fetchTags(userId!),
    enabled: !!userId && enabled,

    // Cache Settings for Offline-First
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};