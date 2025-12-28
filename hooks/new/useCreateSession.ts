// hooks/useCreateSession.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { toast } from 'sonner';
import type { Session } from '@/types';
import { SessionSchema } from '@/lib/schemas/sessionSchema';

interface FinalV0DataInput {
  userId: string;
  title: string;
  session_type_id: string;
  notes: string;
  breaks: any[];
  started_at: string;         // ISO
  ended_at: string;           // ISO
  total_focus_ms: number;
  total_break_ms: number;
}

interface CreateVarsWithId extends FinalV0DataInput {
  id: string; // Pre-generated ID
}

type CreateVars = CreateVarsWithId;
type CreateData = { docId: string };

type CreateCtx = {
  key: (string | undefined)[];
  previous?: Session[];
};

const createSessionOnFirebase = async (sessionData: CreateVarsWithId): Promise<CreateData> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user found');

  const { id, ...rest} = sessionData; // Separate ID from data

  // SECURITY: Runtime Validation
  // This throws an error immediately if data format is invalid (e.g. negative numbers)
  const validData = SessionSchema.parse(rest);

  // Use setDoc with Known ID (offline friendly)
  const docRef = doc(db, 'sessions', id);

  await setDoc(docRef, {
    ...validData,
    userId: user.uid,
    created_at: serverTimestamp(),
  })

  return { docId: id };
};

export const useCreateSession = () => {
  const qc = useQueryClient();

  return useMutation<CreateData, Error, CreateVars, CreateCtx>({
    mutationFn: createSessionOnFirebase,

    // ✅ Optimistic update: add a Session-shaped item to cache
    onMutate: async (newSession) => {
      const key: (string | undefined)[] = ['sessions', newSession.userId];

      await qc.cancelQueries({ queryKey: key });
      const previous = (qc.getQueryData<Session[]>(key) || []).slice();

      const startTime = new Date(newSession.started_at).getTime();
      const endTime = new Date(newSession.ended_at).getTime();
      const date = newSession.started_at.split('T')[0]; // YYYY-MM-DD

      const optimisticSession: Session = {
        id: newSession.id,
        title: newSession.title,
        type: newSession.session_type_id,
        notes: newSession.notes,
        sessionTime: newSession.total_focus_ms,
        breakTime: newSession.total_break_ms,
        startTime,
        endTime,
        date,
      };

      qc.setQueryData<Session[]>(key, (old = []) => [optimisticSession, ...old]);

      if (process.env.NODE_ENV === 'development') {
        console.log('[useCreateSession] optimistic session added:', optimisticSession);
      }

      return { key, previous };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) {
        qc.setQueryData(ctx.key, ctx.previous);
      }
      console.error('Failed to save session:', error);
      toast.error('Failed to save session', { description: error.message });
    },

    onSuccess: () => {
      toast.success('Session saved');
      // Firestore onSnapshot will soon overwrite cache with the real list.
    },

    onSettled: () => {
      // No invalidate needed; onSnapshot keeps sessions in sync.
    },
  });
};
