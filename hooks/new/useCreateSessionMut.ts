// Same as original stable version with better types

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { toast } from 'sonner';

// v0 Firestore data shape
interface FinalV0DataInput {
  id: string;                 // you were already passing this from tracker
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

// what mutation returns
type CreateSessionResult = string; // just return docId for now

// --- Query Client Helper ---
const useSessionQueryClient = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: ['sessions'],
    });
};

// --- Create on Firebase ---
const createSessionOnFirebase = async (
  sessionData: FinalV0DataInput
): Promise<CreateSessionResult> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user found');

  const dataToSave = {
    id: sessionData.id, // v0 internal id
    userId: user.uid,
    title: sessionData.title,
    session_type_id: sessionData.session_type_id,
    notes: sessionData.notes,
    breaks: sessionData.breaks,
    started_at: sessionData.started_at,
    ended_at: sessionData.ended_at,
    total_focus_ms: sessionData.total_focus_ms,
    total_break_ms: sessionData.total_break_ms,
    created_at: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'sessions'), dataToSave);
  return docRef.id;
};

// --- Hook ---
export const useCreateSession = () => {
  const invalidateSessions = useSessionQueryClient();

  return useMutation<CreateSessionResult, Error, FinalV0DataInput>({
    mutationFn: createSessionOnFirebase,

    onSuccess: () => {
      toast.success('Session saved');
      console.log('Session saved to Firebase "sessions" collection.');
      // invalidateSessions();
    },

    onError: (error) => {
      toast.error('Failed to save session', {
        description: error.message,
      });
      console.error('Failed to save session (will retry):', error);
    },
  });
};


// --- Usage on call site ---
// const { mutate: createSession, isPending } = useCreateSession();

// createSession({
//   id: someInternalId,
//   userId: user.uid,
//   title,
//   session_type_id,
//   notes,
//   breaks,
//   started_at,
//   ended_at,
//   total_focus_ms,
//   total_break_ms,
// });
