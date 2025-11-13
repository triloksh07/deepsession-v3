import { ReactNode } from 'react';

export interface BreaksArray {
    start: Date;
    end: Date | null;
}

// This interface matches the 'breaks' table in our ERD
export interface Break {
    id: string; // UUID
    session_id: string; // Foreign key to the session
    break_started_at: string; // ISO 8601 string
    break_ended_at: string; // ISO 8601 string
}

// This interface matches the 'sessions' table in our ERD
export interface Session {
    title: ReactNode;
    id: string; // UUID
    userId: string; // We'll add this when we connect to auth
    session_type_id: string | null;
    notes: string;
    started_at: string; // ISO 8601 string
    ended_at: string; // ISO 8601 string
    total_focus_ms: number;
    total_break_ms: number;
}


export interface EditableProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}


// --- Main TimerCard Component ---
export interface TimerCardProps {
    sessionState: 'idle' | 'running' | 'paused';
    localDescription: string;
    setLocalDescription: (value: string) => void;
    selectedSessionType: string | null;
    setSelectedSessionType: (id: string | '') => void;
    handleStart: () => void;
    displayTime: number;
    displayBreakTime: number;
    handleToggleBreak: () => void;
    handleEnd: () => void;
}

// --- NEW: The Type Guard Function ---
/**
 * A TypeScript type guard that checks if a given object conforms to the Session interface.
 * It performs runtime validation of the object's structure and types.
 * @param {any} payload - The object to validate.
 * @returns {payload is Session} - True if the object is a valid Session, false otherwise.
 */
export const isSession = (payload: Session): payload is Session => {
    // 1. Check if the payload is a non-null object
    if (typeof payload !== 'object' || payload === null) {
        console.error("Validation failed: Payload is not an object.");
        return false;
    }

    // 2. Check for the existence and correct type of essential properties
    const hasId = typeof payload.id === 'string';
    const hasUserId = typeof payload.userId === 'string';
    const hasStartedAt = typeof payload.started_at === 'string';
    const hasEndedAt = typeof payload.ended_at === 'string';
    const hasFocusMs = typeof payload.total_focus_ms === 'number';
    const hasBreakMs = typeof payload.total_break_ms === 'number';
    // const hasBreaksArray = Array.isArray(payload.breaks);

    // 3. If any essential property is missing, fail the validation
    if (!hasId || !hasUserId || !hasStartedAt || !hasEndedAt || !hasFocusMs || !hasBreakMs) {
        console.error("Validation failed: A required property is missing or has the wrong type.", {
            hasId, hasUserId, hasStartedAt, hasEndedAt, hasFocusMs, hasBreakMs, // hasBreaksArray
        });
        return false;
    }

    // 4. If all checks pass, the object is a valid Session
    return true;
};

// Define the types for the props
// export interface AppHeaderProps {
//     theme: string | undefined;
// }