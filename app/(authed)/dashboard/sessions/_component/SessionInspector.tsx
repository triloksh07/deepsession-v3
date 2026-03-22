// _components/SessionInspector.tsx
import React, { useState, useEffect } from 'react';
import { Session } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Edit, Edit3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SafeMarkdown } from '@/components/SafeMarkdown';

// --- FORMATTERS ---
const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface SessionInspectorProps {
    session: Session;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<Session>) => void;
}

export function SessionInspector({ session, onClose, onUpdate }: SessionInspectorProps) {
    // 1. ISOLATED LOCAL STATE
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editDraft, setEditDraft] = useState<Partial<Session>>({});
    const [topicDraft, setTopicDraft] = useState<string>("");

    // Reset drafts if the selected session changes
    useEffect(() => {
        setIsEditingDetails(false);
        setIsEditingNotes(false);
        setEditDraft({});
        setTopicDraft("");
    }, [session.id]);

    // 2. THE CONSOLIDATED SAVE ENGINE
    const handleSave = () => {
        const updates: Partial<Session> = {};
        let tagsChanged = false;
        let updatedTags = { ...session.tags };

        if (editDraft.title !== undefined) updates.title = editDraft.title;
        if (editDraft.notes !== undefined) updates.notes = editDraft.notes;

        if (editDraft.tags?.activity) {
            updatedTags.activity = editDraft.tags.activity;
            tagsChanged = true;
        }
        if (editDraft.tags?.source !== undefined) {
            updatedTags.source = editDraft.tags.source;
            tagsChanged = true;
        }

        if (topicDraft !== "") {
            const cleanTopics = topicDraft.split(',').map(t => t.trim()).filter(Boolean);
            if (JSON.stringify(cleanTopics) !== JSON.stringify(updatedTags.topic)) {
                updatedTags.topic = cleanTopics;
                tagsChanged = true;
            }
        }

        if (tagsChanged) updates.tags = updatedTags;

        if (Object.keys(updates).length > 0) {
            onUpdate(session.id, updates);
        }

        setIsEditingDetails(false);
        setIsEditingNotes(false);
        setEditDraft({});
        setTopicDraft("");
    };

    // 3. RENDER THE UI
    return (
        <Card className="h-full flex flex-col overflow-hidden border-border/50 shadow-md transition-all">
            
            {/* HEADER (Title & Meta) */}
            <CardHeader className="bg-muted/30 border-b pb-4 shrink-0">
                <div className="flex items-start justify-between gap-4">
                    {isEditingDetails ? (
                        <Input
                            className="font-bold text-lg"
                            defaultValue={session.title}
                            onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                            autoFocus
                        />
                    ) : (
                        <CardTitle className="text-xl leading-tight">
                            {session.title || 'Untitled Session'}
                        </CardTitle>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-1 shrink-0">
                        {isEditingDetails ? (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingDetails(false)}>Cancel</Button>
                                <Button size="sm" className="bg-[#8A2BE2] text-white" onClick={handleSave}>Save</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setIsEditingDetails(true);
                                    setTopicDraft((session.tags?.topic || []).join(', '));
                                }} title="Edit Details">
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={onClose}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2 font-mono">
                    <span>{formatDate(session.date)}</span>
                    <span>•</span>
                    <span>{formatTime(session.sessionTime)} Focus</span>
                </div>
            </CardHeader>

            {/* BODY (Scrollable) */}
            <CardContent className="flex-1 overflow-y-auto p-0 flex flex-col">

                {/* TAXONOMY ZONE */}
                <div className="p-4 border-b bg-muted/10">
                    {isEditingDetails ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-3">
                                {/* ACTIVITY SELECTOR */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Activity</label>
                                    <Select
                                        value={editDraft.tags?.activity || session.tags?.activity || 'Other'}
                                        onValueChange={(val) => setEditDraft({
                                            ...editDraft,
                                            tags: { ...(editDraft.tags || session.tags), activity: val }
                                        })}
                                    >
                                        <SelectTrigger className="bg-background"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Coding">Coding</SelectItem>
                                            <SelectItem value="Reading">Reading</SelectItem>
                                            <SelectItem value="Writing">Writing</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* SOURCE SELECTOR */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Source</label>
                                    <Select
                                        value={editDraft.tags?.source || session.tags?.source || ''}
                                        onValueChange={(val) => setEditDraft({
                                            ...editDraft,
                                            tags: { ...(editDraft.tags || session.tags), source: val }
                                        })}
                                    >
                                        <SelectTrigger className="bg-background"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Independent">Independent</SelectItem>
                                            <SelectItem value="Course">Course</SelectItem>
                                            <SelectItem value="Book">Book</SelectItem>
                                            <SelectItem value="None">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* TOPIC INPUT (Stable) */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Topics</label>
                                <Input
                                    placeholder="e.g. React, Firebase, System Design..."
                                    value={topicDraft}
                                    onChange={(e) => setTopicDraft(e.target.value)}
                                    className="bg-background"
                                />
                                <p className="text-[10px] text-muted-foreground">Comma separated. Extracted on save.</p>
                            </div>
                        </div>
                    ) : (
                        /* READ-ONLY BADGES */
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-[#8A2BE2]">{session.tags?.activity || 'Other'}</Badge>
                            {session.tags?.source && session.tags.source !== 'None' && (
                                <Badge variant="outline">{session.tags.source}</Badge>
                            )}
                            {(session.tags?.topic || []).map((t: string, i: number) => (
                                <Badge key={i} variant="secondary">#{t}</Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* NOTES ZONE (The Seamless Toggle) */}
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Session Notes</h4>
                        {!isEditingNotes && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => {
                                setEditDraft({ ...editDraft, notes: session.notes });
                                setIsEditingNotes(true);
                            }}>
                                <Edit3 className="w-3 h-3 mr-1" /> Edit Notes
                            </Button>
                        )}
                    </div>

                    {isEditingNotes ? (
                        <div className="flex-1 flex flex-col gap-3 h-full min-h-[300px]">
                            <Textarea
                                className="flex-1 resize-none font-mono text-sm p-4 bg-background focus-visible:ring-[#8A2BE2]"
                                placeholder="Write your notes in Markdown..."
                                value={editDraft.notes ?? session.notes ?? ''}
                                onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 shrink-0">
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(false)}>Cancel</Button>
                                {/* We route this directly to handleSave to utilize the unified pipeline */}
                                <Button size="sm" className="bg-[#8A2BE2]" onClick={handleSave}>Save Notes</Button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="prose prose-sm dark:prose-invert max-w-none cursor-text hover:bg-muted/30 p-2 -mx-2 rounded transition-colors"
                            onClick={() => {
                                setEditDraft({ ...editDraft, notes: session.notes });
                                setIsEditingNotes(true);
                            }}
                            title="Click anywhere to edit notes"
                        >
                            {session.notes ? (
                                <SafeMarkdown content={session.notes} />
                            ) : (
                                <p className="text-muted-foreground italic opacity-50">Click to add notes...</p>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}