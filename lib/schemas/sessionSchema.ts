import { z } from 'zod';

// Validation Rules
export const SessionSchema = z.object({
    // We DO NOT include 'id' here because Firestore generates it
    // We DO NOT include 'userId' here if it's strictly in the path, 
    // but if you store it in the doc, validate it.
    userId: z.string().min(1, "User ID is required"),

    title: z.string().min(0).max(150, "Title is too long"),
    session_type_id: z.string(),
    notes: z.string().optional().default(""),

    // Timestamps must be valid ISO strings
    started_at: z.iso.datetime({ message: "Invalid start date format" }),
    ended_at: z.iso.datetime({ message: "Invalid end date format" }),

    // Durations must be non-negative integers
    total_focus_ms: z.number().int().nonnegative("Focus time cannot be negative"),
    total_break_ms: z.number().int().nonnegative("Break time cannot be negative"),

    // Strict structure for breaks
    breaks: z.array(
        z.object({
            start: z.string(),
            end: z.string(),
        })
    ).default([]),

});

// Infer the type from the schema automatically
export type CreateSessionInput = z.infer<typeof SessionSchema>;


/** For future iterations (needs codebase refactor)
 // The "Clean" Schema
breaks: z.array(
    z.object({
        // Automatically convert ISO string -> Unix Timestamp (Number)
        start: z.coerce.date().transform(date => date.getTime()),
        end: z.coerce.date().transform(date => date.getTime()),
        
        // If duration is missing, calculate it automatically
        duration: z.number().int().nonnegative().optional()
    }).transform(data => ({
        ...data,
        // Ensure duration exists even if frontend didn't send it
        duration: data.duration ?? (data.end - data.start)
    }))
).default([]),
 */