import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { pushToOfflineQueue } from '@/lib/offline-queue';

interface FinalV0DataInput {
  id: string;
  userId: string;
  title: string;
  session_type_id: string;
  notes: string;
  breaks: any[];
  started_at: string;
  ended_at: string;
  total_focus_ms: number;
  total_break_ms: number;
}

/**
 * Variables type passed into mutate()
 * _localId optional (used only for optimstic + queue)
 */
type CreateSessionVariables = FinalV0DataInput & {
  _localId?: string;
};

/**
 * Result type returned by mutationFn
 */
type CreateSessionResult = {
  id: string;
} & Omit<FinalV0DataInput, 'id'> & {
  _localId?: string;
};

/**
 * Context type used inside onMutate/onError
 */
type CreateSessionContext = {
  key: (string | undefined)[];
  previous: any[] | undefined;
};

const createSessionOnFirebase = async (
  sessionData: CreateSessionVariables
): Promise<CreateSessionResult> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user found');

  const dataToSave = {
    userId: user.uid,
    title: sessionData.title,
    session_type_id: sessionData.session_type_id,
    notes: sessionData.notes || '',
    breaks: sessionData.breaks || [],
    started_at: sessionData.started_at,
    ended_at: sessionData.ended_at,
    total_focus_ms: sessionData.total_focus_ms,
    total_break_ms: sessionData.total_break_ms,
    created_at: serverTimestamp(),
  };

  // addDoc will write to local cache when offline and sync when back online
  const docRef = await addDoc(collection(db, 'sessions'), dataToSave);

  return {
    id: docRef.id,
    ...dataToSave,
    _localId: sessionData._localId,
  };
};

export const useCreateSession = () => {
  const qc = useQueryClient();

  return useMutation<CreateSessionResult, Error, CreateSessionVariables, CreateSessionContext>({
    // ✅ mutationFn ab properly typed hai
    mutationFn: async (payload) => {
      try {
        return await createSessionOnFirebase(payload);
      } catch (err) {
        console.warn('Firestore write failed, saving to offline queue', err);

        const localId = `local-${nanoid()}`;

        await pushToOfflineQueue({
          type: 'create-session',
          payload: { ...payload, _localId: localId },
        });

        // optimistic local object
        return {
        //   id: localId,
          ...payload,
          _localId: localId,
        } as CreateSessionResult;
      }
    },

    // ✅ context type: CreateSessionContext
    onMutate: async (newSession) => {
      const key: (string | undefined)[] = ['sessions', newSession.userId];

      await qc.cancelQueries({ queryKey: key });
      const previous = (qc.getQueryData(key) as any[]) || [];

      const optimistic: CreateSessionResult = {
        // id: newSession.id ?? `local-${Date.now()}`,
        ...newSession,
      };

      qc.setQueryData(key, [optimistic, ...previous]);

      return { key, previous };
    },

    onError: (err, newSession, context) => {
      if (context?.key && context?.previous) {
        qc.setQueryData(context.key, context.previous);
      }
      console.error('Failed to save session locally', err);
      toast.error('Failed to save session locally');
    },

    onSuccess: (data, variables) => {
      toast.success('Session saved');

      const key: (string | undefined)[] = ['sessions', variables.userId];

      qc.setQueryData(key, (old: any[] = []) => {
        if (!old.length) return [data];

        return old.map((item) => {
          const isLocalMatch =
            (variables._localId && item.id === variables._localId) ||
            String(item.id).startsWith('local-');

          return isLocalMatch ? { ...item, ...data } : item;
        });
      });
    },

    onSettled: (_data, _err, variables) => {
      // optional: usually onSnapshot hi reconcile kar dega
      qc.invalidateQueries({
        queryKey: ['sessions', variables?.userId],
        refetchType: 'none',
      });
    },
  });
};

//* --- Example Usage On Call Site --- 
// const { mutate: createSession, isPending } = useCreateSession();
// createSession(finalSession);