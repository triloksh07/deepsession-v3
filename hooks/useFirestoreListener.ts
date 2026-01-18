// useFirestoreListener.ts
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect } from 'react';
import logger from "@/lib/utils/logger";
import { useQueryClient } from '@tanstack/react-query';

export function useSessionsRealtime(userId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', userId),
      orderBy('started_at', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Update react-query cache (no refetch needed)
      qc.setQueryData(['sessions', userId], sessions);
    }, (err) => {
      logger.error('onSnapshot error', err);
    });

    return () => unsubscribe();
  }, [userId, qc]);
}
