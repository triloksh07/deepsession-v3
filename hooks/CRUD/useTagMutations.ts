import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tag } from '@/types';
import { toast } from 'sonner';
import logger from "@/lib/utils/logger";

// --- Types ---
// Explicitly require ID to be passed IN so optimistic UI knows the ID immediately
export interface CreateTagInputWithId extends Omit<Tag, 'createdAt'> {
  id: string; 
}

export type UpdateTagInput = {
  id: string;
  updates: Partial<Tag>;
};

type TagCtx = {
  key: (string | undefined)[];
  previous?: Tag[];
};

type CreateData = { docId: string };

// --- Create ---
const createTagOnFirebase = async (newTag: CreateTagInputWithId): Promise<CreateData> => {
  const { id, ...tagData } = newTag;

  // Use setDoc with Known ID (offline friendly)
  const docRef = doc(db, 'tags', id);

  await setDoc(docRef, {
    ...tagData,
    createdAt: serverTimestamp(), // Let server handle exact time
  });

  return { docId: id };
};

export const useCreateTag = (userId: string) => {
  const qc = useQueryClient();

  return useMutation<CreateData, Error, CreateTagInputWithId, TagCtx>({
    mutationFn: createTagOnFirebase,

    onMutate: async (newTag) => {
      const key: (string | undefined)[] = ['tags', userId];

      await qc.cancelQueries({ queryKey: key });
      const previous = (qc.getQueryData<Tag[]>(key) || []).slice();

      // Optimistic payload
      const optimisticTag: Tag = {
        ...newTag,
        createdAt: Date.now(), // Local fallback for UI sorting
      };

      qc.setQueryData<Tag[]>(key, (old = []) => 
        [...old, optimisticTag].sort((a, b) => a.name.localeCompare(b.name))
      );

      logger.info('[useCreateTag] optimistic tag added:', optimisticTag);

      return { key, previous };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) {
        qc.setQueryData(ctx.key, ctx.previous);
      }
      logger.error('Failed to add tag:', error);
      toast.error('Failed to create tag', {
        description: error.message || "Please check your permissions."
      });
    },

    onSuccess: () => {
      toast.success('Tag created');
    },
  });
};

// --- Update ---
const updateTagOnFirebase = async ({ id, updates }: UpdateTagInput) => {
  if (!id) throw new Error('No tag ID provided');
  
  const tagRef = doc(db, 'tags', id);
  const adaptedUpdates: Record<string, any> = { ...updates };

  if (Object.keys(adaptedUpdates).length === 0) return;

  await updateDoc(tagRef, adaptedUpdates);
};

export const useUpdateTag = (userId: string) => {
  const qc = useQueryClient();

  return useMutation<void, Error, UpdateTagInput, TagCtx>({
    mutationFn: updateTagOnFirebase,
    
    onMutate: async ({ id, updates }) => {
      const key: (string | undefined)[] = ['tags', userId];
      
      await qc.cancelQueries({ queryKey: key });
      const previous = (qc.getQueryData<Tag[]>(key) || []).slice();

      const next = previous.map((tag) =>
        tag.id === id ? { ...tag, ...updates } : tag
      );

      qc.setQueryData<Tag[]>(key, next);

      return { key, previous };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) qc.setQueryData(ctx.key, ctx.previous);
      logger.error('Failed to update tag:', error);
      toast.error('Failed to update tag');
    },

    onSuccess: () => {
      toast.success('Tag updated');
    }
  });
};

// --- Delete ---
const deleteTagOnFirebase = async (id: string) => {
  if (!id) throw new Error("No tag ID provided");
  const tagRef = doc(db, 'tags', id);
  await deleteDoc(tagRef);
};

export const useDeleteTag = (userId: string) => {
  const qc = useQueryClient();

  return useMutation<void, Error, string, TagCtx>({
    mutationFn: deleteTagOnFirebase,
    
    onMutate: async (id) => {
      const key: (string | undefined)[] = ['tags', userId];
      
      await qc.cancelQueries({ queryKey: key });
      const previous = (qc.getQueryData<Tag[]>(key) || []).slice();

      const next = previous.filter((tag) => tag.id !== id);

      qc.setQueryData<Tag[]>(key, next);

      return { key, previous };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) qc.setQueryData(ctx.key, ctx.previous);
      logger.error('Failed to delete tag:', error);
      toast.error('Failed to delete tag');
    },

    onSuccess: () => {
      toast.success('Tag deleted');
    }
  });
};