import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Goal } from '@/types';
import { toast } from 'sonner';

// --- Types ---

// Data needed to create a goal (omit server-managed fields)
type CreateGoalInput = Omit<Goal, 'id' | 'userId' | 'createdAt'>;

// Data needed to update a goal
type UpdateGoalInput = {
  id: string; // The doc ID
  updates: Partial<Goal>; // The fields to change
};

type GoalCtx = {
  key: (string | undefined)[];
  previous?: Goal[];
};

type CreateData = { docId: string };

// --- Create ---
const createGoalOnFirebase = async (newGoal: CreateGoalInput): Promise<CreateData> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const goalToSave = {
    ...newGoal,
    userId: user.uid,
    createdAt: new Date().toISOString(), // client-side ISO string
  };

  const docRef = await addDoc(collection(db, 'goals'), goalToSave);
  return { docId: docRef.id }
};

export const useCreateGoal = () => {
  const qc = useQueryClient();
  return useMutation<CreateData, Error, CreateGoalInput, GoalCtx>({
    mutationFn: createGoalOnFirebase,

    // 🔹 OPTIMISTIC UPDATE – sessions jaisa
    onMutate: async (newGoal) => {
      const user = auth.currentUser;
      if (!user) {
        console.error('[useCreateGoal] No authenticated user onMutate');
        return { key: [], previous: [] };
      }

      const userId = user.uid;
      const key: (string | undefined)[] = ['goals', userId];

      await qc.cancelQueries({ queryKey: key });

      const previous = (qc.getQueryData<Goal[]>(key) || []).slice();

      const optimisticGoal: Goal = {
        // temp id – snapshot aate hi Firestore wale se replace ho jaayega
        id: `optimistic-${Date.now()}`,
        // id: newGoal.id,
        userId,
        createdAt: new Date().toISOString(),
        ...newGoal,
      };

      qc.setQueryData<Goal[]>(key, (old = []) => [optimisticGoal, ...old]);

      if (process.env.NODE_ENV === 'development') {
        console.log('[useCreateGoal] optimistic goal added:', optimisticGoal);
      }

      return { key, previous };
    },
    onSuccess: () => {
      toast.success('Goal created successfully!');
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) {
        qc.setQueryData<Goal[]>(ctx.key, ctx.previous);
      }
      toast.error('Failed to create goal', {
        description: error.message || 'Please try again.',
      });
      console.error('Failed to create goal:', error);
    },
  });
};

// --- Update ---
const updateGoalOnFirebase = async ({ id, updates }: UpdateGoalInput) => {
  if (!id) throw new Error('No goal ID provided');
  const goalRef = doc(db, 'goals', id);
  await updateDoc(goalRef, updates);
};

export const useUpdateGoal = (userId: string) => {
  const qc = useQueryClient();
  return useMutation<void, Error, UpdateGoalInput, GoalCtx>({
    mutationFn: updateGoalOnFirebase,

    // 🔹 optimistic update
    onMutate: async ({ id, updates }) => {
      const key: (string | undefined)[] = ['goals', userId];

      await qc.cancelQueries({ queryKey: key });

      const previous = (qc.getQueryData<Goal[]>(key) || []).slice();

      const next = previous.map((goal) =>
        goal.id === id ? { ...goal, ...updates } : goal
      );

      qc.setQueryData<Goal[]>(key, next);

      return { key, previous };
    },
    onSuccess: () => {
      toast.success('Goal updated');
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) {
        qc.setQueryData<Goal[]>(ctx.key, ctx.previous);
      }
      toast.error('Failed to update goal', { description: error.message });
      console.error('Failed to update goal:', error);
    },
  });
};

// --- Delete ---
const deleteGoalOnFirebase = async (id: string) => {
  if (!id) throw new Error('No goal ID provided');
  const goalRef = doc(db, 'goals', id);
  await deleteDoc(goalRef);
};

export const useDeleteGoal = (userId: string) => {
  const qc = useQueryClient();
  return useMutation<void, Error, string, GoalCtx>({
    mutationFn: deleteGoalOnFirebase,

    // 🔹 optimistic delete
    onMutate: async (id) => {
      const key: (string | undefined)[] = ['goals', userId];

      await qc.cancelQueries({ queryKey: key });

      const previous = (qc.getQueryData<Goal[]>(key) || []).slice();

      const next = previous.filter((goal) => goal.id !== id);

      qc.setQueryData<Goal[]>(key, next);

      return { key, previous };
    },

    onSuccess: () => {
      toast.success('Goal deleted');
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) {
        qc.setQueryData<Goal[]>(ctx.key, ctx.previous);
      }
      toast.error('Failed to delete goal', { description: error.message });
      console.error('Failed to delete goal:', error);
    },
  });
};
