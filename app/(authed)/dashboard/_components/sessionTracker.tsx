'use client'
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StopCircleIcon, CoffeeIcon, PlayIcon, FileText, Eye } from 'lucide-react';
import { useSessionStore } from '@/store/sessionStore';
import PersistentTimer, { TimerHandle } from '@/app/(authed)/dashboard/_lib/PersistentTimer';
import { useShallow } from 'zustand/react/shallow';
import { auth } from '@/lib/firebase';
import { useCreateSession } from '@/hooks/new/useCreateSession';
import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config';
import type { Session } from '@/types';
import { formatTimerDuration as formatTime } from '@/lib/timeUtils';
import { EditableProps } from '@/types/typeDeclaration';
import { SafeMarkdown } from '@/components/SafeMarkdown';
import { db } from '@/lib/firebase';
import { doc, collection } from 'firebase/firestore';

function EditableTitle({ value, onChange, disabled = false }: EditableProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setCurrentValue(value); }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing])

    const handleBlur = () => {
        setIsEditing(false);
        if (currentValue.trim() !== value.trim() && currentValue.trim() !== '') {
            onChange(currentValue.trim());
        } else {
            setCurrentValue(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleBlur();
        else if (e.key === 'Escape') {
            setCurrentValue(value);
            setIsEditing(false);
        }
    };

    return (
        <div className="w-full">
            {isEditing && !disabled ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={currentValue}
                    onChange={((e) => setCurrentValue(e.target.value))}
                    placeholder="What are you focusing on?"
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[#2a2a2a] text-white placeholder-gray-400 rounded-lg px-4 py-3 border border-transparent focus:border-[#8A2BE2] focus:ring-0 outline-none"
                />
            ) : (
                <span
                    onClick={() => !disabled && setIsEditing(true)}
                    className={`block w-full text-white px-4 py-3 rounded-lg cursor-pointer transition hover:bg-[#2a2a2a]/50 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                    {value || 'Focus Session'}
                </span>
            )}
        </div>
    );
}

export default function SessionTracker() {
    const {
        isActive,
        isOnBreak,
        title,
        type,
        notes,
        sessionStartTime,
        breaks,
        toggleBreak,
        clearActiveSession,
        startSession,
        updateSessionDetails,
    } = useSessionStore(
        useShallow((state) => ({
            isActive: state.isActive,
            isOnBreak: state.onBreak,
            startSession: state.startSession,
            title: state.title,
            type: state.type,
            notes: state.notes,
            sessionStartTime: state.sessionStartTime,
            breaks: state.breaks,
            toggleBreak: state.toggleBreak,
            updateSessionDetails: state.updateSessionDetails,
            clearActiveSession: state.clearActiveSession,
        }))
    );
    const status = isActive ? (isOnBreak ? 'paused' : 'running') : 'idle';
    const createSessionMutation = useCreateSession();
    const { isPending: isSaving } = createSessionMutation;
    const timerRef = useRef<TimerHandle>(null);
    const [displaySessionTime, setDisplaySessionTime] = useState(0);
    const [displayBreakTime, setDisplayBreakTime] = useState(0);

    const handleTickCallback = useCallback((sessionMs: number, breakMs: number) => {
        setDisplaySessionTime(sessionMs);
        setDisplayBreakTime(breakMs);
    }, []);

    // --- FIX: PERSISTENT BUFFER STATE ---
    // Initialize from LocalStorage if available to survive refreshes
    const [draftNotes, setDraftNotes] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ds-active-notes-draft');
            // If we have a saved draft, use it. Otherwise fall back to server notes.
            return saved || notes || '';
        }
        return notes || '';
    });

    // 1. Save to LocalStorage on every keystroke (fast, sync)
    useEffect(() => {
        if (draftNotes) {
            localStorage.setItem('ds-active-notes-draft', draftNotes);
        } else {
            localStorage.removeItem('ds-active-notes-draft');
        }
    }, [draftNotes]);

    // 2. Sync from Server -> Draft (Only if we don't have a local unsaved draft)
    // This prevents the "empty" server state from clobbering your restored work on load.
    useEffect(() => {
        const local = typeof window !== 'undefined' ? localStorage.getItem('ds-active-notes-draft') : null;
        if (!local && notes !== draftNotes) { setDraftNotes(notes || ''); }
    }, [notes, draftNotes]);

    // Flush to global store (Zustand)
    const handleNotesCommit = () => {
        if (draftNotes !== notes) {
            updateSessionDetails({ notes: draftNotes });
            // Optional: We keep the localStorage item until the session fully ends
        }
    };

    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionType, setSessionType] = useState('');

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSubmit: Partial<Session> = {
            title: sessionTitle.trim(),
            type: sessionType || 'Other',
            notes: ''
        }
        startSession(dataToSubmit as Session);
    };

    const handleEnd = async () => {
        if (!timerRef.current || !sessionStartTime) return;
        const user = auth.currentUser;
        if (!user) return;

        // GENERATE ID CLIENT-SIDE (Secure & Offline Friendly)
        // This creates a reference with a new auto-generated ID.
        
        // 1. GENERATE ID & SNAPSHOT TIME
        const newSessionId = doc(collection(db, 'sessions')).id;
        const endTimeISO = new Date().toISOString(); 

        // 2. SANITIZE BREAKS (The Logic Fix)
        // We keep them as Strings, but we ensure 'end' is never undefined.
        const sanitizedBreaks = breaks.map((b) => {
            // If the break has no 'end', use the session's end time.
            const finalEnd = b.end || endTimeISO;
            
            return {
                start: b.start,
                end: finalEnd,
                // Optional: We can still calculate duration for the DB if you ever uncomment that field
                // duration: new Date(finalEnd).getTime() - new Date(b.start).getTime() 
            };
        });

        // 3. COMMIT NOTES & TIMER
        handleNotesCommit();
        // CLEAR LOCAL STORAGE ON END
        localStorage.removeItem('ds-active-notes-draft');
        const { sessionTime, breakTime } = timerRef.current.endSession();
        // const endTime = new Date().toISOString();

        const finalV0Data = {
            id: newSessionId,
            userId: user.uid,
            title: title,
            session_type_id: type,
            notes: draftNotes || notes || "", // Prefer draft
            breaks: sanitizedBreaks,
            started_at: sessionStartTime,
            ended_at: endTimeISO,
            total_focus_ms: sessionTime,
            total_break_ms: breakTime,
        };

        createSessionMutation.mutateAsync(finalV0Data);
        try {
            await clearActiveSession();
        } catch (error) {
            console.error("End session failed:", error);
        }
    };

    const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

    return (
        <>
            <PersistentTimer
                ref={timerRef}
                isActive={isActive}
                isOnBreak={isOnBreak}
                onTick={handleTickCallback}
            />
            <div className="flex items-center justify-center p-2 bg-background ">
                {status === 'idle' ? (
                    // --- IDLE STATE ---
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-muted-foreground">
                                Start a new Focus Session
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-6">
                            <form onSubmit={handleStart} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Session Title</Label>
                                    <Input
                                        id="title"
                                        value={sessionTitle}
                                        onChange={(e) => setSessionTitle(e.target.value)}
                                        placeholder="What are you working on?"
                                        autoFocus
                                        className="w-full dark:bg-[#2a2a2a] dark:text-white placeholder-gray-400 rounded-lg px-4 py-3 mb-6 border border-transparent focus:border-[#8A2BE2] focus:ring-0 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Session Type</Label>
                                    <Select value={sessionType} onValueChange={setSessionType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a session type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DEFAULT_SESSION_TYPES.map((sessionType) => (
                                                <SelectItem key={sessionType.id} value={sessionType.id}>
                                                    {sessionType.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <Button type="submit" className="flex-1 px-10 py-4 rounded-full bg-linear-to-r from-[#8A2BE2] to-[#5D3FD3] text-white font-bold text-base shadow-lg shadow-[#8A2BE2]/30 hover:opacity-90 transition-opacity cursor-pointer">
                                        Start Focus
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    // --- ACTIVE STATE ---
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-muted-foreground">
                                <div className="text-center text-muted-foreground">
                                    {isSaving ? 'Syncing...' : (isOnBreak ? (
                                        <div className="relative top-4 right-4 flex items-center space-x-2 text-red-400 font-semibold animate-pulse">
                                            <CoffeeIcon className="w-4 h-4" />
                                            <span>ON Break</span>
                                        </div>
                                    ) : (
                                        <div className="relative top-4 right-4 flex items-center space-x-2 text-green-400 font-semibold animate-pulse">
                                            <span className="w-4 h-4 rounded-full" />
                                            <span>Active</span>
                                        </div>
                                    ))}
                                </div>
                            </CardTitle>

                            <div className="flex flex-col space-y-4">
                                {type && (
                                    <div className="self-start mt-2 bg-purple-700/30 text-purple-300 text-xs font-semibold px-3 py-1 rounded-full">
                                        {DEFAULT_SESSION_TYPES.find(t => t.id === type)?.label || type}
                                    </div>
                                )}

                                <div className="w-full">
                                    <EditableTitle
                                        value={title}
                                        onChange={(newTitle) => updateSessionDetails({ title: newTitle })}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="text-center space-y-6">
                            <div className="space-y-2">
                                <div className={`transition-all duration-300 ${isOnBreak ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    <div className="text-6xl font-mono tracking-tight">
                                        {formatTime(displaySessionTime)}
                                    </div>
                                    <div className="text-muted-foreground">Session Time</div>
                                </div>

                                {displayBreakTime > 0 && (
                                    <div className={`transition-all duration-300 ${isOnBreak ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        <div className="text-2xl font-mono tracking-tight">
                                            {formatTime(displayBreakTime)}
                                        </div>
                                        <div className="text-muted-foreground">Break Time</div>
                                    </div>
                                )}
                            </div>

                            {/* --- SESSION SUMMARY / NOTES --- */}
                            <div className="text-left w-full">
                                <Tabs defaultValue="write" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-2">
                                        <TabsTrigger value="write" className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Write
                                        </TabsTrigger>
                                        <TabsTrigger value="preview" className="flex items-center gap-2">
                                            <Eye className="w-4 h-4" /> Preview
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="write">
                                        <Textarea
                                            value={draftNotes}
                                            onChange={(e) => setDraftNotes(e.target.value)}
                                            onBlur={handleNotesCommit}
                                            placeholder="Capture session summary (Markdown)..."
                                            className="min-h-[120px] max-h-[40vh] resize-none focus-visible:ring-[#8A2BE2]"
                                        />
                                        {/* <p className="text-xs text-muted-foreground mt-1 text-right">
                                            **bold**, - list, `code`, [link]
                                        </p> */}
                                    </TabsContent>
                                    <TabsContent value="preview" className="min-h-[120px] p-3 border rounded-md bg-muted/50 overflow-y-auto max-h-[40vh]">
                                        {/* Render DRAFT notes so preview matches what was just typed */}
                                        {draftNotes ? (
                                            <SafeMarkdown content={draftNotes} />
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">Nothing to preview...</span>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>

                            <div className="flex justify-center space-x-4 pt-2">
                                <Button
                                    onClick={toggleBreak}
                                    variant="outline"
                                    size="lg"
                                    className={classNames(
                                        "px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all cursor-pointer",
                                        status === 'running' ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-green-500 text-white "
                                    )}
                                >
                                    {status === 'running' ? <CoffeeIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                    <span>{status === 'running' ? 'Take Break' : 'Resume'}</span>
                                </Button>

                                <Button
                                    onClick={handleEnd}
                                    variant="destructive"
                                    size="lg"
                                    className="bg-red-600/80 text-white px-6 py-3 rounded-lg font-bold flex items-center space-x-2 cursor-pointer hover:bg-red-600"
                                >
                                    <StopCircleIcon className="w-5 h-5" />
                                    <span>End</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    )
}