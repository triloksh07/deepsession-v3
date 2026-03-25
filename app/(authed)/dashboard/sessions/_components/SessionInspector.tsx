// _components/SessionInspector.tsx
import React, { useState, useEffect } from 'react';
import { Session } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Edit, Edit3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AutocompleteInput from '@/app/(authed)/dashboard/_components/AutoCompleteInput';
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
    filterOptions: {
        activities: string[];
        sources: string[];
        topics: string[];
    };
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<Session>) => void;
    onDelete: () => void;
}

export function SessionInspector({ session, filterOptions, onClose, onUpdate }: SessionInspectorProps) {
    // 1. ISOLATED LOCAL STATE
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editDraft, setEditDraft] = useState<Partial<Session>>({});
    // const [topicDraft, setTopicDraft] = useState<string>("");
    const [topicInput, setTopicInput] = useState('');

    // Reset drafts if the selected session changes
    useEffect(() => {
        setIsEditingDetails(false);
        setIsEditingNotes(false);
        setEditDraft({});
        // setTopicDraft("");
        setTopicInput('');
    }, [session.id]);

    // 2. THE CONSOLIDATED SAVE ENGINE
    // const handleSave = () => {
    //     const updates: Partial<Session> = {};
    //     let tagsChanged = false;
    //     let updatedTags = { ...session.tags };

    //     if (editDraft.title !== undefined) updates.title = editDraft.title;
    //     if (editDraft.notes !== undefined) updates.notes = editDraft.notes;

    //     if (editDraft.tags?.activity) {
    //         updatedTags.activity = editDraft.tags.activity;
    //         tagsChanged = true;
    //     }
    //     if (editDraft.tags?.source !== undefined) {
    //         updatedTags.source = editDraft.tags.source;
    //         tagsChanged = true;
    //     }

    //     if (topicDraft !== "") {
    //         const cleanTopics = topicDraft.split(',').map(t => t.trim()).filter(Boolean);
    //         if (JSON.stringify(cleanTopics) !== JSON.stringify(updatedTags.topic)) {
    //             updatedTags.topic = cleanTopics;
    //             tagsChanged = true;
    //         }
    //     }

    //     if (tagsChanged) updates.tags = updatedTags;

    //     if (Object.keys(updates).length > 0) {
    //         onUpdate(session.id, updates);
    //     }

    //     setIsEditingDetails(false);
    //     setIsEditingNotes(false);
    //     setEditDraft({});
    //     setTopicDraft("");
    // };

    // --- TOPIC BADGE ENGINE ---
    const currentTopics = editDraft.tags?.topic ?? session.tags?.topic ?? [];

    const addTopic = (newTopic: string) => {
        const trimmed = newTopic.trim();
        if (!trimmed) return;

        // Prevent duplicates
        if (!currentTopics.includes(trimmed)) {
            setEditDraft(prev => ({
                ...prev,
                tags: { ...(prev.tags || session.tags), topic: [...currentTopics, trimmed] }
            }));
        }
        setTopicInput(''); // Clear input after adding
    };

    const removeTopic = (topicToRemove: string) => {
        setEditDraft(prev => ({
            ...prev,
            tags: {
                ...(prev.tags || session.tags),
                topic: currentTopics.filter(t => t !== topicToRemove)
            }
        }));
    };

    const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault(); // Prevent form submission or jumping
            addTopic(topicInput);
        }
    };

    // 2. THE CONSOLIDATED STRICT SAVE ENGINE
    const handleSave = () => {
        const updates: Partial<Session> = {};
        let tagsChanged = false;

        // Ensure we don't crash if session.tags is undefined on older data
        let updatedTags = { ...(session.tags || {}) };

        // 1. Strict Title Check (Only update if defined AND different)
        if (editDraft.title !== undefined && editDraft.title !== session.title) {
            updates.title = editDraft.title;
        }

        // 2. Strict Notes Check
        if (editDraft.notes !== undefined && editDraft.notes !== session.notes) {
            updates.notes = editDraft.notes;
        }

        // 3. Strict Taxonomy Checks
        if (editDraft.tags?.activity && editDraft.tags.activity !== session.tags?.activity) {
            updatedTags.activity = editDraft.tags.activity;
            tagsChanged = true;
        }
        if (editDraft.tags?.source !== undefined && editDraft.tags.source !== session.tags?.source) {
            updatedTags.source = editDraft.tags.source;
            tagsChanged = true;
        }

        // 4. Strict Topic Array Check
        // if (topicDraft !== "") {
        //     const cleanTopics = topicDraft.split(',').map(t => t.trim()).filter(Boolean);
        //     const currentTopics = session.tags?.topic || [];

        //     if (JSON.stringify(cleanTopics) !== JSON.stringify(currentTopics)) {
        //         updatedTags.topic = cleanTopics;
        //         tagsChanged = true;
        //     }
        // }

        // 4. Strict Topic Array Check
        const draftTopics = editDraft.tags?.topic;
        if (draftTopics !== undefined) {
            const currentSessionTopics = session.tags?.topic || [];
            // Only flag for database write if the arrays are actually different
            if (JSON.stringify(draftTopics) !== JSON.stringify(currentSessionTopics)) {
                updatedTags.topic = draftTopics;
                tagsChanged = true;
            }
        }

        if (tagsChanged) updates.tags = updatedTags;

        // 5. THE GATEKEEPER: Only fire the mutation if actual changes exist
        if (Object.keys(updates).length > 0) {
            onUpdate(session.id, updates);
        }

        // Reset all UI states
        setIsEditingDetails(false);
        setIsEditingNotes(false);
        setEditDraft({});
        // We do not reset topicDraft here unless you want the input to clear every time you click away.
    };

    // 3. RENDER THE UI
    return (
        <Card className="h-full flex flex-col overflow-hidden border-border/50 shadow-md transition-all">

            {/* HEADER (Title & Meta) */}
            <CardHeader className="bg-muted/30 border-b pb-4 shrink-0">
                <div className="flex items-start justify-between gap-4">
                    {/* {isEditingDetails ? (
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
                    )} */}
                    {isEditingDetails ? (
                        <Input className="font-bold text-lg focus-visible:ring-[#8A2BE2]" defaultValue={session.title} onChange={(e) =>
                            setEditDraft({ ...editDraft, title: e.target.value })}
                            // onBlur={handleSave} // Auto-save when clicking outside
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }} // Auto-save on Enter
                        // autoFocus
                        />
                    ) : (
                        <CardTitle className="text-xl leading-tight cursor-pointer hover:text-[#8A2BE2] transition-colors" onDoubleClick={() => {
                            setEditDraft({ ...editDraft, title: session.title });
                            setIsEditingDetails(true);
                        }}
                            title="Double-click to edit title"
                        >
                            {session.title || 'Untitled Session'}
                        </CardTitle>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-1 shrink-0">
                        {isEditingDetails ? (
                            <>
                                {/* <Button variant="ghost" size="sm" onClick={() => setIsEditingDetails(false)}>Cancel</Button> */}
                                {/* <Button size="sm" className="bg-[#8A2BE2] text-white" onClick={handleSave}>Save</Button> */}

                                {/* Use onMouseDown instead of onClick to prevent the input's onBlur from firing first and saving */}
                                <Button variant="ghost" size="sm" onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIsEditingDetails(false);
                                    setEditDraft({});
                                }}>Cancel</Button>
                                <Button size="sm" className="bg-[#8A2BE2] text-white" onClick={handleSave}>Save</Button>

                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setIsEditingDetails(true);
                                    // setTopicDraft((session.tags?.topic || []).join(', '));
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
                                {/* <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Activity</label>
                                    <Select value={editDraft.tags?.activity || session.tags?.activity || ''} onValueChange={(val) => setEditDraft({
                                        ...editDraft,
                                        tags: { ...(editDraft.tags || session.tags), activity: val }
                                    })}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filterOptions.activities.map(act => (
                                                <SelectItem key={act} value={act}>{act}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div> */}

                                {/* ACTIVITY SELECTOR (Dynamic) */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity</label>
                                    <AutocompleteInput
                                        value={editDraft.tags?.activity ?? session.tags?.activity ?? ''}
                                        onChange={(val) => setEditDraft({
                                            ...editDraft,
                                            tags: { ...(editDraft.tags || session.tags), activity: val }
                                        })}
                                        // Inject default non-study tags alongside existing database tags
                                        options={Array.from(new Set([...filterOptions.activities, 'Coding', 'Reading', 'Admin', 'Free Time']))}
                                        placeholder="Select or type..."
                                    />
                                </div>

                                {/* SOURCE SELECTOR */}
                                {/* <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Source</label>
                                    <Select value={editDraft.tags?.source || session.tags?.source || ''} onValueChange={(val) => setEditDraft({
                                        ...editDraft,
                                        tags: { ...(editDraft.tags || session.tags), source: val }
                                    })}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filterOptions.sources.map(src => (
                                                <SelectItem key={src} value={src}>{src}</SelectItem>
                                            ))}
                                            {!filterOptions.sources.includes('None') && (
                                                <SelectItem value="None">None</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div> */}

                                {/* SOURCE SELECTOR (Dynamic) */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</label>
                                    <AutocompleteInput
                                        value={editDraft.tags?.source ?? session.tags?.source ?? ''}
                                        onChange={(val) => setEditDraft({
                                            ...editDraft,
                                            tags: { ...(editDraft.tags || session.tags), source: val }
                                        })}
                                        // Inject standard defaults alongside existing database sources
                                        options={filterOptions.sources}
                                        placeholder="Select or type..."
                                    // options={Array.from(new Set([...filterOptions.sources, 'Independent', 'Cohort', 'Book', 'None', '']))}
                                    />
                                </div>
                            </div>

                            {/* TOPIC INPUT (Stable) */}
                            {/* <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Topics</label>
                                <Input
                                    placeholder="e.g. React, Firebase, System Design..."
                                    value={topicDraft}
                                    onChange={(e) => setTopicDraft(e.target.value)}
                                    className="bg-background"
                                />
                                <p className="text-[10px] text-muted-foreground">Comma separated. Extracted on save.</p>
                            </div> */}

                            {/* TOPICS BADGE ZONE */}
                            <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Topics</label>

                                {/* 1. The Visual Badges */}
                                <div className="flex flex-wrap gap-2 py-2">
                                    {currentTopics.map(topic => (
                                        <div
                                            key={topic}
                                            onClick={() => removeTopic(topic)}
                                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#8A2BE2]/10 text-[#8A2BE2] rounded-md cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors group"
                                            title="Click to remove"
                                        >
                                            {topic}
                                            <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                        </div>
                                    ))}
                                </div>

                                {/* 2. The Input Field */}
                                <Input
                                    placeholder={currentTopics.length === 0 ? "Type a topic and press Enter..." : "Add another topic..."}
                                    value={topicInput}
                                    onChange={(e) => setTopicInput(e.target.value)}
                                    onKeyDown={handleTopicKeyDown}
                                    className="bg-background text-sm h-9"
                                />
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

                    {/* {isEditingNotes ? (
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
                                We route this directly to handleSave to utilize the unified pipeline
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
                    )} */}

                    {isEditingNotes ? (
                        <div className="flex-1 flex flex-col gap-3 h-full min-h-[300px]">
                            <Textarea
                                className="flex-1 resize-none font-mono text-sm p-4 bg-background focus-visible:ring-[#8A2BE2]"
                                placeholder="Write your notes in Markdown..."
                                value={editDraft.notes ?? session.notes ?? ''}
                                onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                                onBlur={handleSave} // Auto-save when clicking outside
                                autoFocus
                                // NEW: Intercept focus and push cursor to the absolute end of the text
                                onFocus={(e) => {
                                    const length = e.currentTarget.value.length;
                                    e.currentTarget.setSelectionRange(length, length);
                                }}
                            />
                            <div className="flex justify-end gap-2 shrink-0">
                                <Button variant="ghost" size="sm" onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIsEditingNotes(false);
                                    setEditDraft({});
                                }}>Cancel</Button>
                                <Button size="sm" className="bg-[#8A2BE2]" onClick={handleSave}>Save Notes</Button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="prose prose-sm dark:prose-invert max-w-none cursor-text hover:bg-muted/30 p-2 -mx-2 rounded transition-colors"
                            onDoubleClick={() => {
                                setEditDraft({ ...editDraft, notes: session.notes });
                                setIsEditingNotes(true);
                            }}
                            title="Double-click anywhere to edit notes"
                        >
                            {session.notes ? (
                                <SafeMarkdown content={session.notes} />
                            ) : (
                                <p className="text-muted-foreground italic opacity-50">Double-click to add notes...</p>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}