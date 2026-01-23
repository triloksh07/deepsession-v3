"use client";

import { useCallback, useState, useEffect } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { useShallow } from "zustand/react/shallow";
import { useCreateSession } from "@/hooks/CRUD/useCreateSession";
import { db, auth } from "@/lib/firebase";
import { doc, collection } from "firebase/firestore";
import { toast } from "sonner";
import { Session } from "@/types";
import logger from "@/lib/utils/logger";
import { setStorageItem, removeStorageItem, getStorageItem } from "@/lib/utils/storage";

export function useSessionController() {
    // 1. OPTIMIZED SELECTOR (Only subscribe to what we need)
    const {
        isActive,
        onBreak,
        title,
        type,
        storeNotes,
        // sessionStartTime,
        // breaks,
        // Actions
        storeStartSession,
        storeToggleBreak,
        updateSessionDetails: storeUpdateDetails,
        clearActiveSession
    } = useSessionStore(
        useShallow((state) => ({
            isActive: state.isActive,
            onBreak: state.onBreak,
            storeStartSession: state.startSession,
            title: state.title,
            type: state.type,
            storeNotes: state.notes,
            // sessionStartTime: state.sessionStartTime,
            // breaks: state.breaks,
            storeToggleBreak: state.toggleBreak,
            updateSessionDetails: state.updateSessionDetails,
            clearActiveSession: state.clearActiveSession,
        }))
    );
    const createSessionMutation = useCreateSession();
    const { isPending: isSaving } = createSessionMutation;

    // --- NOTES SYNC LOGIC ---
    const [draftNotes, setDraftNotes] = useState(() => {
        if (typeof window !== "undefined") {
            return getStorageItem("ACTIVE_NOTES_DRAFT") || storeNotes || "";
        }
        return storeNotes || "";
    });


    // Sync Draft -> LocalStorage on every keystroke (fast, sync)
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (draftNotes) {
                setStorageItem("ACTIVE_NOTES_DRAFT", draftNotes);
            } else {
                removeStorageItem("ACTIVE_NOTES_DRAFT");
            }
        }
    }, [draftNotes]);

    // TODO: understand this logic and compare 
    // Sync Store -> Draft (External updates)
    useEffect(() => {
        if (storeNotes && storeNotes !== draftNotes) {
            setDraftNotes(storeNotes);
        }
    }, [storeNotes])

    // TODO: checkout dependency
    const commitNotes = useCallback(() => {
        if (draftNotes !== storeNotes) {
            storeUpdateDetails({ notes: draftNotes });
        }
    }, [draftNotes, storeNotes, storeUpdateDetails]);

    // --- CONTROLLER ACTIONS ---

    const startSession = useCallback((data: Partial<Session>) => {
        storeStartSession(data as Session)
    }, [storeStartSession]);

    const toggleBreak = useCallback(() => {
        storeToggleBreak();
    }, [storeToggleBreak]);

    // TODO: checkout or remove the callback 
    const endSession = useCallback(async () => {
        // 1. READ FRESH STATE (Zustand GetState Pattern)
        // This avoids adding 'breaks' or 'startTime' to the dependency array.
        // This function reference now remains STABLE forever.
        // only fetch data present exactly when called
        const state = useSessionStore.getState();
        if (!state.sessionStartTime) return;

        const user = auth.currentUser;
        // if (!user) return;
        if (!user) {
            toast.error("User not authenticated");
            return;
        }

        // Finalize Logic
        const now = Date.now();
        const start = new Date(state.sessionStartTime).getTime();

        const totalBreakMs = state.breaks.reduce((acc, b) => {
            const bStart = new Date(b.start).getTime();
            const bEnd = b.end ? new Date(b.end).getTime() : now;
            return acc + (bEnd - bStart);
        }, 0)

        const totalSessionMs = (now - start) - totalBreakMs;

        // Sanitize Breaks
        const endTimeISO = new Date().toISOString();
        const sanitizedBreaks = state.breaks.map((b) => ({
            // If the break has no 'end', use the session's end time.
            start: b.start,
            end: b.end || endTimeISO
        }));

        // Payload Construction
        // We generate ID client-side so we don't need to wait for server allocation
        const newSessionId = doc(collection(db, "session")).id;

        const finalData = {
            id: newSessionId,
            userId: user.uid,
            title: title,
            session_type_id: type,
            notes: draftNotes || "",
            breaks: sanitizedBreaks,
            started_at: state.sessionStartTime,
            ended_at: endTimeISO,
            // Note: We keep these purely for backward compatibility until Issue #13 refactor
            total_focus_ms: Math.max(0, totalSessionMs),
            total_break_ms: totalBreakMs,
        };

        // FIRESTORE NATIVE OPTIMISTIC UPDATE
        try {
            // We use .mutate() (void), NOT .mutateAsync(). 
            createSessionMutation.mutate(finalData)

            // Clear UI Immediately
            // The user perceives this as "Instant Save"
            removeStorageItem("ACTIVE_NOTES_DRAFT")
            setDraftNotes("");
            await clearActiveSession();
            // toast.success("Session saved");
        } catch (err) {
            // This catches synchronous errors (e.g., payload construction failed)
            logger.error("Critical session clear error:", err);
            toast.error("Failed to save session.");
        }
    }, [draftNotes, createSessionMutation, clearActiveSession]);

    return {
        // Derived State for UI
        status: isActive ? (onBreak ? "paused" : "running") : "idle",
        isActive,
        isOnBreak: onBreak,
        currentSession: {
            title,
            type,
            // startTime: sessionStartTime,
            phase: onBreak ? "ON BREAK" : "ACTIVE"
        },
        isSaving,

        // Notes
        draftNotes,
        setDraftNotes,
        commitNotes,

        // Actions
        startSession,
        toggleBreak,
        endSession,
        updateTitle: (t: string) => storeUpdateDetails({ title: t }),
    };
}