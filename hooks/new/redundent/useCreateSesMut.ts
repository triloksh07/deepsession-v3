// --- new --- // useCreateSessionMutation.ts
// hooks/useCreateSession.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { toast } from 'sonner';
import type { Session } from '@/types'; // your UI type

interface FinalV0DataInput {
    id: string;
    userId: string;
    title: string;
    session_type_id: string;
    notes: string;
    breaks: any[];
    started_at: string;     // ISO
    ended_at: string;       // ISO
    total_focus_ms: number;
    total_break_ms: number;
}

type CreateVars = FinalV0DataInput;
type CreateData = { docId: string };

type CreateCtx = {
    key: (string | undefined)[];
    previous?: Session[];
    optimisticId?: string;
};

const createSessionOnFirebase = async (sessionData: CreateVars): Promise<CreateData> => {
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
    return { docId: docRef.id };
};

export const useCreateSession = () => {
    const qc = useQueryClient();

    return useMutation<CreateData, Error, CreateVars, CreateCtx>({
        mutationFn: createSessionOnFirebase,

        // optimistic update
        onMutate: async (newSession) => {
            const key: (string | undefined)[] = ['sessions', newSession.userId];
            await qc.cancelQueries({ queryKey: key });

            const previous = (qc.getQueryData<Session[]>(key) || []).slice();
            const startTime = new Date(newSession.started_at).getTime(); // in milli seconds
            const endTime = new Date(newSession.ended_at).getTime();
            const startDate = newSession.started_at.split('T')[0]; // YYYY-MM-DD
            const optimisticId = Date.now().toString() + `local-${newSession.id}`;

            /*for debugging only*/
            if (process.env.NODE_ENV === 'development') {
                // new Date("ISOString(UTC-Format)"); // IST format
                console.log('start Time from createSessionHook', startTime); // in ms
                console.log('end Time from createSessionHook', endTime);
                console.log('date from create session hook: newSession.started_at: ', startDate); // YYYY-MM-DD
            }
            /*------------------*/

            const optimisticSession: Partial<Session> = {
                title: newSession.title,
                type: newSession.session_type_id,
                notes: newSession.notes,
                sessionTime: newSession.total_focus_ms,
                breakTime: newSession.total_break_ms,
                startTime,
                endTime,
                date: startDate
            }

            qc.setQueryData<any[]>(key, [optimisticSession, ...previous]);

            return { key, previous };
        },

        onError: (error, _vars, ctx) => {
            if (ctx?.key && ctx.previous) {
                qc.setQueryData(ctx.key, ctx.previous);
            }
            console.error('Failed to save session:', error);
            toast.error('Failed to save session', { description: error.message });
        },

        onSuccess: (data, vars, ctx) => {
            toast.success('Session saved');
            // Later onSnapshot will bring fully fresh data anyway.
        },

        onSettled: () => {
            // No need to invalidate if onSnapshot is active; it will update cache.
            // If you want belt+suspenders, you *could* invalidate ['sessions', userId] here.
        },
    });
};
