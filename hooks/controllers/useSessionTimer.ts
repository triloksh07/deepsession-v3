"use client";

import { useState, useEffect, useRef } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { useShallow } from "zustand/react/shallow";

/**
 * THE HEART (Drift-Corrected)
 * Calculates current session and break durations based on timestamps.
 * Uses Date.now() for atomic truth (Data Integrity).
 * Uses Self-Correcting Timeout to snap updates to the start of the second (Visual Integrity).
 * ⚠️ Isolate usage in small components (TimerDisplay) to prevent app-wide lag.
 */
export function useSessionTimer() {
    const {
        startTime,
        breakTime,  // an Array of Breaks
        isActive,
        onBreak
    } = useSessionStore(
        useShallow((state) => ({
            startTime: state.sessionStartTime,
            breakTime: state.breaks,
            isActive: state.isActive,
            onBreak: state.onBreak,
        })))

    // Force re-render
    const [_, setTick] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // --- 1. CALCULATION ENGINE (Data Integrity) ---
    // This logic is completely drift-proof because it relies on the System Clock.
    const now = Date.now();

    // a. Calculate Total Break Time (Closed breaks + Current open break)
    const totalBreakMs = breakTime.reduce((acc, b) => {
        const start = new Date(b.start).getTime();
        const end = b.end ? new Date(b.end).getTime() : now;
        return acc + (end - start);
    }, 0);

    // b. Calculate Current Session Duration
    let sessionMs = 0;
    if (startTime) {
        const start = new Date(startTime).getTime();
        sessionMs = Math.max(0, (now - start) - totalBreakMs);
    }

    // c. Calculate Current Break Duration (Visual only)
    let breakMs = 0;
    if (onBreak) {
        const currentBreakStart = new Date(breakTime[breakTime.length - 1]?.start || now).getTime();
        breakMs = now - currentBreakStart;
    }

    // --- 2. THE LOOP (Phase Correction) ---
    useEffect(() => {
        if (!isActive && !startTime) return;

        const tick = () => {
            const currentNow = Date.now();
            setTick(currentNow);

            // DRIFT CORRECTION LOGIC:
            // Instead of waiting 1000ms, we wait exactly enough to hit the next second.
            // Example: If it's 800ms past the second, we wait 200ms.
            // We add a small buffer (e.g. 20ms) to ensure we don't wake up slightly *before* the second flips due to browser jitter.
            const msUntilNextSecond = 1000 - (currentNow % 1000);

            timeoutRef.current = setTimeout(tick, msUntilNextSecond);
        }

        // Initial Start
        tick();

        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) };

    }, [isActive, startTime]); // Re-aligns whenever the timer state changes

    return { sessionMs, breakMs };
}