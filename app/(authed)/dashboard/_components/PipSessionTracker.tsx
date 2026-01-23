'use client'
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Eye } from 'lucide-react';
import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config';
import type { Session } from '@/types';
import { EditableProps } from '@/types/typeDeclaration';
import { SafeMarkdown } from '@/components/SafeMarkdown';
import { TimerDisplay } from "@/app/(authed)/dashboard/_components/TimerDisplay";
import { usePip } from "@/context/PipProvider";

// ---- NEW IMPORTS ----
import { useSessionController } from '@/hooks/controllers/useSessionController';

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
                    className="w-full dark:text-white placeholder-gray-400 rounded-lg px-4 py-3 border border-transparent focus:border-[#8A2BE2] focus:ring-0 outline-none"
                />
            ) : (
                <span
                    onClick={() => !disabled && setIsEditing(true)}
                    className={`block w-full dark:text-white px-4 py-3 rounded-lg cursor-pointer transition hover:bg-[#2a2a2a]/10 dark:hover:bg-[#2a2a2a]/50 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                    {value || 'Focus Session'}
                </span>
            )}
        </div>
    );
}


export default function SessionTracker() {
    // 1. Logic Hook (The Brain)
    const {
        status, isActive, isOnBreak, currentSession,
        draftNotes, setDraftNotes, commitNotes,
        startSession, toggleBreak, endSession, updateTitle, isSaving
    } = useSessionController();

    // 2. PiP Hook
    const { togglePip, isPipActive } = usePip();

    // 3. Local Form State
    const [formTitle, setFormTitle] = useState('');
    const [formType, setFormType] = useState('');

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSubmit: Partial<Session> = {
            title: formTitle.trim(),
            type: formType || 'Other',
            notes: ''
        }
        startSession(dataToSubmit as Session);
    };


    return (
        <div className="flex items-center justify-center p-2 bg-background">
            {status === 'idle' ? (
                // --- START FORM ---
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-muted-foreground">Start a new Focus Session</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleStart} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Session Title</Label>
                                <Input
                                    id="title"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="What are you working on?"
                                    autoFocus
                                    className="focus:border-[#8A2BE2]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Session Type</Label>
                                <Select value={formType} onValueChange={setFormType}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        {DEFAULT_SESSION_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full mt-4 bg-linear-to-r from-[#8A2BE2] to-[#5D3FD3] text-white font-bold text-base shadow-lg shadow-[#8A2BE2]/30 hover:opacity-90 transition-opacity cursor-pointer">Start Focus</Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                // --- ACTIVE SESSION ---
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center pb-0">
                        {/* Title & Type */}
                        <div className="flex flex-col items-center space-y-2">
                            {currentSession.type && (
                                <span className="bg-purple-700/20 text-purple-500 text-xs font-semibold px-3 py-1 rounded-full">
                                    {DEFAULT_SESSION_TYPES.find(t => t.id === currentSession.type)?.label || currentSession.type}
                                </span>
                            )}
                            <div className="w-full text-black"><EditableTitle value={currentSession.title} onChange={updateTitle} /></div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* ⚡ TIMER DISPLAY (Isolated) */}
                        {isPipActive ?
                            <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-6 text-center">
                                <h3 className="text-lg font-medium mb-2">Timer Popped Out</h3>
                                <p className="text-sm text-muted-foreground mb-4">Focus session is running in a separate window.</p>
                                <Button variant="outline" onClick={togglePip}>Bring Back</Button>
                            </div>
                            :
                            <div className="min-h-[200px]">
                                <TimerDisplay
                                    isActive={isActive}
                                    isOnBreak={isOnBreak}
                                    currentPhase={currentSession.phase}
                                    status={status}
                                    isSaving={isSaving}
                                    // Pass Controls
                                    onToggleBreak={toggleBreak}
                                    onEndSession={endSession}
                                    onPip={togglePip}
                                />
                            </div>}

                        {/* Notes (Only visible in Dashboard) */}
                        <div className="text-left w-full border-t pt-4">
                            <Tabs defaultValue="write" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-2">
                                    <TabsTrigger value="write"><FileText className="w-4 h-4 mr-2" /> Write</TabsTrigger>
                                    <TabsTrigger value="preview"><Eye className="w-4 h-4 mr-2" /> Preview</TabsTrigger>
                                </TabsList>
                                <TabsContent value="write">
                                    <Textarea
                                        value={draftNotes}
                                        onChange={(e) => setDraftNotes(e.target.value)}
                                        onBlur={commitNotes}
                                        placeholder="Capture session summary (Markdown)..."
                                        className="min-h-[100px] resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2 text-right">
                                        **bold**, - list, `code`, [link]
                                    </p>
                                </TabsContent>
                                <TabsContent value="preview" className="min-h-[100px] p-3 border rounded-md bg-muted/50">
                                    {/* Render DRAFT notes so preview matches what was just typed */}
                                    {draftNotes ? (
                                        <SafeMarkdown content={draftNotes} />
                                    ) : (
                                        <span className="text-sm text-muted-foreground italic">Nothing to preview...</span>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}