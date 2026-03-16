// hooks/useSessionMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDoc, deleteDoc, doc, writeBatch, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Session, SessionTags } from "@/types";
import { toast } from "sonner";
import logger from "@/lib/utils/logger";

// Data needed to update a session
export type UpdateSessionInput = {
  id: string;                // Firestore doc ID (Session.id)
  updates: Partial<Session>; // fields from UI model
};

type CreateCtx = {
  key: (string | undefined)[];
  previous?: Session[];
};

export interface BatchUpdateIntent {
  topics?: string[];
  appendTopics: boolean; // TRUE = Merge, FALSE = Overwrite
  activity?: string;
  source?: string;
}

export interface BatchUpdateInput {
  ids: string[],
  intent: BatchUpdateIntent,
  // updates: Record<string, any>;
  // updates: {
  //   tags?: SessionTags,
  // }
  // We could expand this later to batch-update notes, etc.
};

// --- low-level Firestore update ---
const updateSessionOnFirebase = async ({
  id,
  updates,
}: UpdateSessionInput): Promise<void> => {
  if (!id) throw new Error("No session ID provided");

  const sessionRef = doc(db, "sessions", id);

  const adaptedUpdates: Record<string, any> = {};

  if (typeof updates.title === "string") {
    adaptedUpdates.title = updates.title;
  }

  if (typeof updates.notes === "string") {
    adaptedUpdates.notes = updates.notes;
  }

  // --- NEW: Allow tags to pass through to Firestore ---
  if (updates.tags !== undefined) {
    adaptedUpdates.tags = updates.tags;
  }

  if (Object.keys(adaptedUpdates).length === 0) {
    return;
  }

  await updateDoc(sessionRef, adaptedUpdates);
};

// ✅ userId injected from caller (NOT auth.currentUser inside hook)
export const useUpdateSession = (userId: string) => {
  const qc = useQueryClient();

  return useMutation<void, Error, UpdateSessionInput, CreateCtx>({
    mutationFn: updateSessionOnFirebase,

    onMutate: async ({ id, updates }) => {
      const key: (string | undefined)[] = ["sessions", userId];

      // just in case some refetch in progress
      await qc.cancelQueries({ queryKey: key });

      const previous = (qc.getQueryData<Session[]>(key) || []).slice();

      const next = previous.map((session) =>
        session.id === id ? { ...session, ...updates } : session
      );

      qc.setQueryData<Session[]>(key, next);

      return { key, previous };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) {
        qc.setQueryData<Session[]>(ctx.key, ctx.previous);
      }
      logger.error("Failed to update session:", error);
      toast.error("Failed to update session", {
        description: error.message,
      });
    },

    onSuccess: () => {
      toast.success("Session updated");
    },
  });
};

// --- low-level delete ---
const deleteSessionOnFirebase = async (id: string): Promise<void> => {
  if (!id) throw new Error("No session ID provided");
  const sessionRef = doc(db, "sessions", id);
  await deleteDoc(sessionRef);
};

export const useDeleteSession = (userId: string) => {
  const qc = useQueryClient();

  return useMutation<void, Error, string, CreateCtx>({
    mutationFn: deleteSessionOnFirebase,

    onMutate: async (id) => {
      const key: (string | undefined)[] = ["sessions", userId];

      await qc.cancelQueries({ queryKey: key });

      const previous = (qc.getQueryData<Session[]>(key) || []).slice();

      const next = previous.filter((session) => session.id !== id);

      qc.setQueryData<Session[]>(key, next);

      return { key, previous };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) {
        qc.setQueryData<Session[]>(ctx.key, ctx.previous);
      }
      logger.error("Failed to delete session:", error);
      toast.error("Failed to delete session", {
        description: error.message,
      });
    },

    onSuccess: () => {
      toast.success("Session deleted");
    },
  });
};

// --- Batch Upadte Intent based ---
const batchUpdateSessionOnFirebase = async ({ ids, intent }: BatchUpdateInput) => {

  // if (!ids.length || Object.keys(updates).length === 0) return;
  if (!ids.length) return;

  const batch = writeBatch(db);

  // Firestore allows up to 500 operations per batch
  ids.forEach((id) => {
    const sessionRef = doc(db, "sessions", id);
    const patch: Record<string, any> = {};
    // const adaptedUpdates: Record<string, any> = {};

    // if (updates.tags !== undefined) {
    //   adaptedUpdates.tags = updates.tags;
    // }

    if (intent.activity) patch['tags.activity'] = intent.activity;
    if (intent.source) patch['tags.source'] = intent.source;
    if (intent.topics && intent.topics.length > 0) {
      if (intent.appendTopics) {
        // Firebase native array merge (prevents duplicates automatically)
        patch['tags.topic'] = arrayUnion(...intent.topics);
      } else {
        // Destructive overwrite
        patch['tags.topic'] = intent.topics;
      }
    };

    if (Object.keys(patch).length > 0) {
      batch.update(sessionRef, patch);
    }
  });

  await batch.commit();
};

export const useBatchUpdateSession = (userId: string) => {
  const qc = useQueryClient();

  return useMutation<void, Error, BatchUpdateInput, CreateCtx>({
    mutationFn: batchUpdateSessionOnFirebase,

    onMutate: async ({ ids, intent }) => {
      const key: (string | undefined)[] = ["session", userId]

      await qc.cancelQueries({ queryKey: key });

      const previous = (qc.getQueryData<Session[]>(key) || []).slice();

      // Arrays are meant for ordering; Sets are meant for finding.
      const idSet = new Set(ids);

      const next = previous.map((session) => {
        if (!idSet.has(session.id)) return session; // Ignore unselected

        // Deep clone to prevent mutating the original cache reference
        const updatedSession = JSON.parse(JSON.stringify(session));
        if (!updatedSession.tags) updatedSession.tags = {};

        if (intent.activity) updatedSession.tags.activity = intent.activity;
        if (intent.source) updatedSession.tags.source = intent.source;

        if (intent.topics && intent.topics.length > 0) {
          if (intent.appendTopics) {
            // Replicate arrayUnion locally
            const oldTopics = Array.isArray(updatedSession.tags.topic) ? updatedSession.tags.topic : [];
            updatedSession.tags.topic = Array.from(new Set([...oldTopics, ...intent.topics]));
          } else {
            updatedSession.tags.topic = intent.topics;
          }
        }
        return updatedSession;
      }
        // inefficient as it will take O(N) and may block main thread if update many docs at once ()
        // ids.includes(session.id) ? { ...session, ...updates } : session

        // Set loopup is an O(1) operataion
        // idSet.has(session.id) ? { ...session, ...intent } : session

      );

      qc.setQueryData<Session[]>(key, next);

      return { key, previous };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) {
        qc.setQueryData<Session[]>(ctx.key, ctx.previous);
      }
      logger.info("+++++++++++++++++++++++++++++++++")
      logger.error("Failed to batch Update Sessions");
      toast.error("Failed to Update sessions", {
        description: error.message,
      });
    },

    onSuccess: () => {
      toast.success("Sessions Updated")
    },

    onSettled: (data, error, vars, ctx) => {
      // The anchor: Always refetch after error or success to guarantee server-state alignment
      if (ctx?.key) {
        qc.invalidateQueries({ queryKey: ctx.key });
      }
    },

  });
};