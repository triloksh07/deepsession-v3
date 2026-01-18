// app/(authed)/dashboard/_lib/PersistentTimer.ts
// This component is "headless" — it has no UI. Its only job is to keep time.

'use client';

import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { useSessionStore } from '@/store/sessionStore';
import { useShallow } from 'zustand/react/shallow';
import logger from "@/lib/utils/logger";

export interface TimerHandle {
  start: () => void;
  getCurrentDisplayTimes: () => { session: number; break: number };
  endSession: () => { sessionTime: number; breakTime: number };
}

interface PersistentTimerProps {
  isActive: boolean;
  isOnBreak: boolean;
  onTick: (sessionMs: number, breakMs: number) => void;
}

const PersistentTimer = forwardRef<TimerHandle, PersistentTimerProps>(
  ({ isActive, isOnBreak, onTick }: PersistentTimerProps, ref) => {
    // These refs hold the "Truth" of the timer (High Precision)
    const sessionElapsed = useRef(0);
    const breakElapsed = useRef(0);

    // Tracks the last specific "second" we pushed to the UI, 
    // so we don't re-render duplicate times (e.g. 10.1s and 10.2s are both "10s").
    const lastPushedSecond = useRef<number>(-1);

    // Get rehydration data from store
    const { sessionStartTime, breaks, onBreak: isRehydratedOnBreak } = useSessionStore(
      useShallow((state) => ({
        sessionStartTime: state.sessionStartTime,
        breaks: state.breaks,
        onBreak: state.onBreak,
      }))
    );

    // --- 1. REHYDRATION LOGIC (Kept similar, but cleaner) ---
    useEffect(() => {
      if (isActive && sessionStartTime) {
        logger.debug("Rehydrating timer state...");
        logger.debug(`Session Start Time: ${sessionStartTime}`);

        // 1. Ensure startTime is a valid number (milliseconds)
        const startTimeMs = new Date(sessionStartTime).getTime();
        if (isNaN(startTimeMs)) {
          logger.error("Rehydration failed: Invalid start time.");
          return;
        }

        // Calculate duration of all COMPLETED breaks
        let completedBreakDuration = 0;
        const completedBreaks = breaks.filter(b => b.start && b.end);
        completedBreaks.forEach(b => {
          completedBreakDuration += new Date(b.end!).getTime() - new Date(b.start).getTime();
        });

        // Calculate ACTIVE break duration (if currently on break)
        if (isRehydratedOnBreak) {
          const lastBreak = breaks[breaks.length - 1];
          if (lastBreak && !lastBreak.end) {
            const lastBreakStartMs = new Date(lastBreak.start).getTime();
            const elapsedSinceBreakStarted = Date.now() - lastBreakStartMs;

            // The total break time is completed breaks + the current active one
            breakElapsed.current = completedBreakDuration + elapsedSinceBreakStarted;
          }
        } else {
          breakElapsed.current = completedBreakDuration;
        }

        // Calculate total session time (Total - Breaks)
        const totalElapsedSinceStart = Date.now() - startTimeMs;
        sessionElapsed.current = totalElapsedSinceStart - breakElapsed.current;

        logger.debug(`Rehydrated with Session: ${sessionElapsed.current}ms, Break: ${breakElapsed.current}ms`);

        // Synchronously push the rehydrated time to the parent
        // This happens *before* the first paint.

        // Push immediate state so UI doesn't wait 1s to show
        onTick(sessionElapsed.current, breakElapsed.current);
      }
    }, [
      isActive,
      sessionStartTime,
      breaks,
      isRehydratedOnBreak,
      onTick
    ]);

    // --- 2. THE NEW ENGINE (setInterval + Drift Correction) ---
    useEffect(() => {
      // If idle, do nothing
      if (!isActive) return;

      // Run this check every 200ms (High enough to be cheap, low enough to feel responsive)
      // We do NOT update the UI every 200ms, only when the second changes.
      const intervalId = setInterval(() => {
        const now = Date.now();
        if (sessionStartTime) {
          const startTimeMs = new Date(sessionStartTime).getTime();
          if (isOnBreak) {
            // LOGIC: If on break, calculate active break drift
            const lastBreak = breaks[breaks.length - 1];
            if (lastBreak && !lastBreak.end) {
              const breakStart = new Date(lastBreak.start).getTime();
              const currentBreakDuration = now - breakStart;

              // Recalculate total break duration including completed ones
              let completedDuration = 0;
              breaks.filter(b => b.end).forEach(b => {
                completedDuration += new Date(b.end!).getTime() - new Date(b.start).getTime();
              });

              breakElapsed.current = completedDuration + currentBreakDuration;
            }
          } else {
            // LOGIC: If working, Session = (Now - Start) - TotalBreakTime
            let totalBreakTime = 0;
            breaks.forEach(b => {
              const start = new Date(b.start).getTime();
              const end = b.end ? new Date(b.end).getTime() : now;
              totalBreakTime += (end - start);
            });

            const totalDuration = now - startTimeMs;
            sessionElapsed.current = totalDuration - totalBreakTime;
          }
        }

        // --- 3. SMART TICKING (The Performance Fix) ---
        // Only trigger React Update if the *visible second* changed.

        // We check sessionElapsed (in seconds).
        const currentSecond = Math.floor(sessionElapsed.current / 1000);
        // Also check break second if on break
        const currentBreakSecond = Math.floor(breakElapsed.current / 1000);

        // Create a composite key to track "State of the Display"
        // If on break, we track break seconds; if working, session seconds.
        const timeKey = isOnBreak ? -currentBreakSecond : currentSecond;

        if (timeKey !== lastPushedSecond.current) {
          onTick(sessionElapsed.current, breakElapsed.current);
          lastPushedSecond.current = timeKey;
        }
      }, 200)  // Poll at 5Hz (very cheap) to catch the second turn accurately 

      return () => clearInterval(intervalId);
    }, [isActive, isOnBreak, sessionStartTime, breaks, onTick]);

    // --- 3. External API (Controlled by Parent) ---
    useImperativeHandle(ref, () => ({
      start() {
        logger.debug("Timer engine started/reset.");
        sessionElapsed.current = 0;
        breakElapsed.current = 0;
        lastPushedSecond.current = -1;
      },
      getCurrentDisplayTimes() {
        return { session: sessionElapsed.current, break: breakElapsed.current };
      },
      endSession() {
        // Return a clean final number.
        return {
          sessionTime: Math.round(sessionElapsed.current),
          breakTime: Math.round(breakElapsed.current),
        };
      },
    }));

    return null;
  }
);

PersistentTimer.displayName = 'PersistentTimer';
export default PersistentTimer;