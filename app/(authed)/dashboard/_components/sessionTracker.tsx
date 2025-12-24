'use client'
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Square, Coffee, Loader2, StopCircleIcon, CoffeeIcon, PlayIcon, FileText, Eye } from 'lucide-react';
import { useSessionStore } from '@/store/sessionStore';
import PersistentTimer, { TimerHandle } from '@/app/(authed)/dashboard/_lib/PersistentTimer';
import { useShallow } from 'zustand/react/shallow';
import { auth } from '@/lib/firebase';
import { useCreateSession } from '@/hooks/new/useCreateSession';
import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config';
import type { Session } from '@/types';
import { formatTimerDuration as formatTime } from '@/lib/timeUtils';
import { EditableProps } from '@/types/typeDeclaration';
import { nanoid } from 'nanoid';
import { SafeMarkdown } from '@/components/SafeMarkdown';

// --- COMPONENT: BufferedNotes (The Solution) ---
// Mirrors EditableTitle but for Textarea.
// 1. Holds local state while typing (fast, no re-renders of parent).
// 2. Flushes to global store only on BLUR (focus lost).
// 3. Handles external updates (e.g. session reset) via useEffect.
interface BufferedNotesProps {
    value: string;
    onSave: (newValue: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

function BufferedNotes({ value, onSave, placeholder, className, disabled }: BufferedNotesProps) {
    // Local state for immediate feedback and buffering
    const [localValue, setLocalValue] = useState(value);

    // Sync local state if the global value changes externally (e.g., session clear)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        // Only save if content is different to prevent useless network calls
        if (localValue !== value) {
            console.log("Saving notes data to server: ", value);
            onSave(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Optional: Power user feature - Cmd+Enter or Ctrl+Enter to save immediately
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.currentTarget.blur(); // Triggers handleBlur
        }
    };

    return (
        <Textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={className}
            disabled={disabled}
        />
    );
}

// ... [Keep EditableTitle exactly as it was] ...
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

        const { sessionTime, breakTime } = timerRef.current.endSession();
        const endTime = new Date().toISOString();

        const finalV0Data = {
            id: nanoid(),
            userId: user.uid,
            title: title,
            session_type_id: type,
            notes: notes || "",
            breaks: breaks,
            started_at: sessionStartTime,
            ended_at: endTime,
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
                                        className="w-full bg-[#2a2a2a] text-white placeholder-gray-400 rounded-lg px-4 py-3 mb-6 border border-transparent focus:border-[#8A2BE2] focus:ring-0 outline-none"
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

                            {/* --- NOTES SECTION (BUFFERED) --- */}
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
                                        {/* REPLACED: Raw Textarea with BufferedNotes */}
                                        <BufferedNotes
                                            value={notes}
                                            onSave={(newNotes) => updateSessionDetails({ notes: newNotes })}
                                            placeholder="Capture your thoughts (Markdown supported)..."
                                            className="min-h-[120px] resize-none focus-visible:ring-[#8A2BE2]"
                                        />
                                        {/* <p className="text-xs text-muted-foreground mt-1 text-right">
                                            Supports **bold**, - lists, `code`, and [links]
                                        </p> */}
                                    </TabsContent>
                                    <TabsContent value="preview" className="min-h-[120px] p-3 border rounded-md bg-muted/50">
                                        {notes ? (
                                            <SafeMarkdown content={notes} />
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