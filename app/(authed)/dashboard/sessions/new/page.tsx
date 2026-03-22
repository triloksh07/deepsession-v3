'use client';

import React, { Suspense, useEffect, useState, useCallback, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, FileText, Edit, Trash2, Layers, Edit3 } from 'lucide-react';
// import type { Session, ActivityType, SourceType } from '@/types';
import type { Session } from '@/types';
import { UpdateSessionInput } from "@/hooks/CRUD/useSessionMutations";
// import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config';
import { useUpdateSession, useDeleteSession, useBatchUpdateSession, BatchUpdateIntent } from '@/hooks/CRUD/useSessionMutations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // IMPORTED
import { useDashboard } from '../../_components/DashboardProvider';
import { SafeMarkdown } from '@/components/SafeMarkdown';
import { GroupedVirtuoso } from "react-virtuoso";
import { toast } from 'sonner';

import logger from "@/lib/utils/logger";

import { Search, Filter, X } from 'lucide-react'; // Make sure to add these to your lucide-react imports
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import HighlightMatch from '@/app/(authed)/dashboard/_components/HighlightMatch';
import AutocompleteInput from '@/app/(authed)/dashboard/_components/AutoCompleteInput';

import { SessionInspector } from "../_component/SessionInspector";
import { BatchEditorPanel } from "../_component/BatchInspector";
import { EmptyInspectorState } from "../_component/EmptyInspector";

// const sessionTypeMap = new Map<string, { label: string; color: string }>(
//   DEFAULT_SESSION_TYPES.map((type) => [type.id, { label: type.label, color: type.color }])
// );
// const getSessionTypeInfo = (id: string) => sessionTypeMap.get(id) || { label: id, color: '#808080' };

function SessionsListSkeleton() {
    return (
        <div className="space-y-4 p-4">
            <div className="h-6 w-40 rounded bg-muted-foreground/10 animate-pulse" />
            <div className="space-y-3">
                <div className="h-24 rounded-md bg-muted-foreground/5 animate-pulse" />
                <div className="h-24 rounded-md bg-muted-foreground/5 animate-pulse" />
                <div className="h-24 rounded-md bg-muted-foreground/5 animate-pulse" />
            </div>
        </div>
    );
}

// --- FIX: MEMOIZE THE HEAVY LIST ---
const SessionsContent = memo(
    function SessionsContent({
        onEdit,
        onRequestDelete }:
        {
            onEdit: (s: Session) => void;
            onRequestDelete: (s: Session) => void;
        }) {
        const { sessions: sessionList, isLoading, userId } = useDashboard();
        const { mutate: updateMultipleSessionsTag, isPending: isBulkUpdatePending } = useBatchUpdateSession(userId);
        const { mutate: updateSession } = useUpdateSession(userId || '');

        // const sessions = useMemo(() => {
        //   return sessionList ?? [];
        // }, [sessionList]);

        // Memoize the flat list data structure for GroupedVirtuoso
        // It needs: 
        // 1. groupCounts: [2, 5, 1] (2 items in day 1, 5 in day 2...)
        // 2. flatSessions: [s1, s2, s3...] (All sessions flattened)
        // 3. groupDates: ['2023-10-01', '2023-09-30'...] (Headers)
        // const { groupCounts, flatSessions, groupDates } = useMemo(() => {
        //   const list = sessions ?? [];

        //   // 1. Group
        //   const groups = list.reduce((acc: Record<string, Session[]>, session) => {
        //     const date = session.date;
        //     if (!acc[date]) acc[date] = [];
        //     acc[date].push(session);
        //     return acc;
        //   }, {});

        //   // 2. Sort Dates
        //   const sortedDates = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        //   // 3. Flatten
        //   const counts: number[] = [];
        //   const flat: Session[] = [];

        //   sortedDates.forEach((date) => {
        //     // Sort sessions inside the group
        //     const sortedGroup = groups[date].sort((a, b) => b.startTime - a.startTime);
        //     counts.push(sortedGroup.length);
        //     flat.push(...sortedGroup);
        //   });

        //   return { groupCounts: counts, flatSessions: flat, groupDates: sortedDates };
        // }, [sessions]);

        // --- FILTER STATE ---
        const [searchInput, setSearchInput] = useState(''); // Fast state for the UI
        const [debouncedSearch, setDebouncedSearch] = useState(''); // Slow state for the engine

        // NEW: Custom Date Range States (Format: YYYY-MM-DD)
        const [startDate, setStartDate] = useState('');
        const [endDate, setEndDate] = useState('');

        const [activityFilter, setActivityFilter] = useState('All');
        const [sourceFilter, setSourceFilter] = useState('All');
        const [topicFilter, setTopicFilter] = useState('All');
        const [timeRange, setTimeRange] = useState('All'); // 'All', '7d', '30d'

        // ------ STATE VARIABLES FOR BATCH UPDATE ------
        // New State for Batching
        const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
        const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

        // Batch From State
        const [batchActivity, setBatchActivity] = useState('');
        const [batchSource, setBatchSource] = useState('');
        const [batchTopics, setBatchTopics] = useState('');

        const [isAppendingTopics, setIsAppendingTopics] = useState(true);

        // --- MASTER-DETAIL STATE ---
        const [selectedInspectorSession, setSelectedInspectorSession] = useState<Session | null>(null);

        // Temporary state to hold edits before saving
        const [editDraft, setEditDraft] = useState<Partial<Session>>({});
        const [topicDraft, setTopicDraft] = useState<string>(""); // NEW: Holds raw text while typing

        // Wipes stale data every time the modal opens
        useEffect(() => {
            if (isBatchModalOpen) {
                setBatchTopics('');
                setBatchActivity('');
                setBatchSource('');
                setIsAppendingTopics(true); // Default to safe merging
            }
        }, [isBatchModalOpen]);

        //  The Toggle Function
        const toggleSelection = useCallback((id: string) => {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id)
                else next.add(id);
                return next;
            });
        }, []);

        const clearSelection = () => setSelectedIds(new Set());

        // --- DATA EXPORT ENGINE ---

        // JSON FORMAT
        // const handleCopyForAI = async () => {
        //     if (selectedIds.size === 0) return;

        //     // 1. Filter the already-sorted flat list to maintain chronological order
        //     const sessionsToCopy = flatSessions.filter(s => selectedIds.has(s.id));

        //     // 2. Strip the notes and format timestamps into human/AI-readable strings
        //     const aiPayload = sessionsToCopy.map(s => ({
        //         title: s.title || 'Untitled',
        //         date: s.date,
        //         startTime: new Date(s.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        //         endTime: new Date(s.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        //         focusTimeMinutes: Math.floor(s.sessionTime / 60000),
        //         breakTimeMinutes: Math.floor(s.breakTime / 60000),
        //         tags: {
        //             activity: s.tags?.activity || 'Other',
        //             source: s.tags?.source || '',
        //             topics: s.tags?.topic || []
        //         }
        //     }));

        //     // 3. Push to clipboard
        //     try {
        //         await navigator.clipboard.writeText(JSON.stringify(aiPayload, null, 2));
        //         toast.success(`Copied ${selectedIds.size} sessions to clipboard`, {
        //             description: "Ready for AI analysis."
        //         });

        //         // Optional: clearSelection(); if you want it to uncheck everything after copying
        //     } catch (err) {
        //         logger.error("Clipboard API failed:", err);
        //         toast.error("Failed to copy to clipboard");
        //     }
        // };

        // --- TOON DATA EXPORT ENGINE ---
        // const handleCopyForAI = async () => {
        //     if (selectedIds.size === 0) return;

        //     // 1. Filter the already-sorted flat list
        //     const sessionsToCopy = flatSessions.filter(s => selectedIds.has(s.id));

        //     // 2. The TOON Header: Defines array length and keys once to save tokens
        //     const header = `sessions[${sessionsToCopy.length}]{title,date,start,end,focusMin,breakMin,activity,source,topics}:`;

        //     // 3. The TOON Rows: Tabular format (indented by 2 spaces)
        //     const rows = sessionsToCopy.map(s => {
        //         // Escape commas in titles so they don't break the CSV-style parser
        //         const title = s.title ? `"${s.title.replace(/"/g, '""')}"` : "Untitled";
        //         const date = s.date;

        //         // Using 24-hour format saves the ' AM' / ' PM' tokens
        //         const start = new Date(s.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
        //         const end = new Date(s.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });

        //         const focus = Math.floor(s.sessionTime / 60000);
        //         const brk = Math.floor(s.breakTime / 60000);

        //         // Flattening the tags object for optimal TOON encoding
        //         const activity = s.tags?.activity || 'Other';
        //         const source = s.tags?.source || 'None';
        //         const topics = s.tags?.topic?.length ? s.tags.topic.join('|') : 'None';

        //         // TOON syntax requires rows under a tabular header to be indented
        //         return `  ${title},${date},${start},${end},${focus},${brk},${activity},${source},${topics}`;
        //     });

        //     // Combine header and rows
        //     const toonPayload = [header, ...rows].join('\n');

        //     // 4. Push to clipboard
        //     try {
        //         await navigator.clipboard.writeText(toonPayload);
        //         toast.success(`Copied ${selectedIds.size} sessions in TOON format`, {
        //             description: "Ready for token-efficient AI analysis."
        //         });
        //     } catch (err) {
        //         logger.error("Clipboard API failed:", err);
        //         toast.error("Failed to copy to clipboard");
        //     }
        // };

        // --- TOON DATA EXPORT ENGINE (V2) ---
        const handleCopyForAI = async () => {
            if (displayedSessions.length === 0) return;

            if (!startDate || !endDate) {
                toast.info("No date range selected");
                return;
            }

            // 1. Sort chronologically (oldest to newest) so S1 is the first session
            const sortedForExport = [...displayedSessions].sort((a, b) => a.startTime - b.startTime);

            // 2. Add 'id' to the TOON Header
            const header = `sessions[${sortedForExport.length}]{id,title,date,start,end,focusMin,breakMin,activity,topics}:`;

            // 3. Generate Rows with Mapping ID (S1, S2, S3...)
            const rows = sortedForExport.map((s, index) => {
                const mapId = `M${index + 1}`; // <--- THE MAPPING MARKER
                const title = s.title ? `"${s.title.replace(/"/g, '""')}"` : "Untitled";
                const date = s.date;
                const start = new Date(s.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
                const end = new Date(s.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
                const focus = Math.floor(s.sessionTime / 60000);
                const brk = Math.floor(s.breakTime / 60000);
                const activity = s.tags?.activity || 'Other';
                const topics = s.tags?.topic?.length ? s.tags.topic.join('|') : 'None';

                return `  ${mapId},${title},${date},${start},${end},${focus},${brk},${activity},${topics}`;
            });

            const toonPayload = [header, ...rows].join('\n');

            try {
                await navigator.clipboard.writeText(toonPayload);
                toast.success(`Copied ${sortedForExport.length} sessions for AI`, {
                    description: "Mapping IDs (M1, M2...) included."
                });
            } catch (err) {
                toast.error("Failed to copy to clipboard");
            }
        };

        // --- NEW: THE INLINE SAVE ENGINE ---
        // const handleSaveDetails = () => {
        //     if (!selectedInspectorSession) return;

        //     // Only send the fields that actually changed
        //     const updates: Partial<Session> = {};

        //     if (editDraft.title !== undefined) updates.title = editDraft.title;

        //     // If tags were modified in the draft, merge them
        //     if (editDraft.tags) {
        //         updates.tags = {
        //             ...selectedInspectorSession.tags,
        //             ...editDraft.tags
        //         };
        //     }

        //     if (Object.keys(updates).length > 0) {
        //         updateSession({
        //             id: selectedInspectorSession.id,
        //             updates
        //         });

        //         // Optimistically update the local inspector state so it feels instant
        //         setSelectedInspectorSession(prev => prev ? { ...prev, ...updates } : null);
        //     }

        //     // Exit edit mode
        //     setIsEditingDetails(false);
        //     setEditDraft({});
        // };
        // --- THE BULLETPROOF SAVE ENGINE ---
        const handleSaveDetails = () => {
            if (!selectedInspectorSession) return;

            const updates: Partial<Session> = {};

            if (editDraft.title !== undefined) updates.title = editDraft.title;

            // Reconstruct the tags payload
            let updatedTags = { ...selectedInspectorSession.tags };
            let tagsChanged = false;

            if (editDraft.tags?.activity) {
                updatedTags.activity = editDraft.tags.activity;
                tagsChanged = true;
            }
            if (editDraft.tags?.source !== undefined) {
                updatedTags.source = editDraft.tags.source;
                tagsChanged = true;
            }

            // Process the raw topic string into a clean array on save
            if (topicDraft !== "") {
                const cleanTopics = topicDraft.split(',').map(t => t.trim()).filter(Boolean);
                // Only update if it actually changed to prevent unnecessary writes
                if (JSON.stringify(cleanTopics) !== JSON.stringify(updatedTags.topic)) {
                    updatedTags.topic = cleanTopics;
                    tagsChanged = true;
                }
            }

            if (tagsChanged) updates.tags = updatedTags;

            if (Object.keys(updates).length > 0) {
                updateSession({ id: selectedInspectorSession.id, updates });
                setSelectedInspectorSession(prev => prev ? { ...prev, ...updates } : null);
            }

            setIsEditingDetails(false);
            setEditDraft({});
            setTopicDraft(""); // Reset
        };

        // ------ STATE VARIABLES FOR BATCH UPDATE END------

        // --- NEW: THE DEBOUNCE ENGINE ---
        // Waits 300ms after you stop typing to update the actual filter
        useEffect(() => {
            const timer = setTimeout(() => {
                setDebouncedSearch(searchInput);
            }, 300);
            return () => clearTimeout(timer);
        }, [searchInput]);

        // --- DYNAMIC OPTION EXTRACTOR ---
        // Scans your cache to find all unique tags so the dropdowns auto-update
        const filterOptions = useMemo(() => {
            const activities = new Set<string>();
            const sources = new Set<string>();
            const topics = new Set<string>();

            (sessionList || []).forEach(s => {
                activities.add(s.tags?.activity || s.type || 'Other');
                if (s.tags?.source) sources.add(s.tags.source);
                if (s.tags?.topic) {
                    const tArray = Array.isArray(s.tags.topic) ? s.tags.topic : [s.tags.topic];
                    tArray.forEach(t => topics.add(t.trim()));
                }
            });

            return {
                activities: Array.from(activities).sort(),
                sources: Array.from(sources).sort(),
                topics: Array.from(topics).sort()
            };
        }, [sessionList]);

        // --- 3. THE ZERO-LATENCY FILTER PIPELINE ---
        const displayedSessions = useMemo(() => {
            let list = sessionList || [];

            if (debouncedSearch) {
                const lowerTerm = debouncedSearch.toLowerCase();
                list = list.filter(s =>
                    s.title?.toLowerCase().includes(lowerTerm) ||
                    s.notes?.toLowerCase().includes(lowerTerm)
                );
            }

            if (activityFilter !== 'All') {
                list = list.filter(s => (s.tags?.activity || s.type || 'Other') === activityFilter);
            }

            if (sourceFilter !== 'All') {
                list = list.filter(s => s.tags?.source === sourceFilter);
            }

            if (topicFilter !== 'All') {
                list = list.filter(s => {
                    const tArray = s.tags?.topic || [];
                    const topics = Array.isArray(tArray) ? tArray : [tArray];
                    return topics.some(t => t.trim() === topicFilter);
                });
            }

            // NEW: Time Range Filter
            if (timeRange !== 'All') {
                const now = Date.now();
                const msPerDay = 24 * 60 * 60 * 1000;
                const days = timeRange === '7d' ? 7 : 30;
                const cutoff = now - (days * msPerDay);
                list = list.filter(s => s.startTime >= cutoff);
            }

            // NEW: Precise Date Boundary Filter
            if (startDate) {
                // Set to start of the day (00:00:00)
                const startTimestamp = new Date(startDate + 'T00:00:00').getTime();
                list = list.filter(s => s.startTime >= startTimestamp);
            }
            if (endDate) {
                // Set to end of the day (23:59:59)
                const endTimestamp = new Date(endDate + 'T23:59:59').getTime();
                list = list.filter(s => s.startTime <= endTimestamp);
            }

            return list;
        }, [sessionList, debouncedSearch, activityFilter, sourceFilter, topicFilter, timeRange, startDate, endDate]);

        // --- 4. LIST GROUPING (Running on Filtered Data) ---
        const { groupCounts, flatSessions, groupDates } = useMemo(() => {
            // Notice we are grouping `displayedSessions` now, not the raw `sessionList`
            const groups = displayedSessions.reduce((acc: Record<string, Session[]>, session) => {
                const date = session.date;
                if (!acc[date]) acc[date] = [];
                acc[date].push(session);
                return acc;
            }, {});

            const sortedDates = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            const counts: number[] = [];
            const flat: Session[] = [];

            sortedDates.forEach((date) => {
                const sortedGroup = groups[date].sort((a, b) => b.startTime - a.startTime);
                counts.push(sortedGroup.length);
                flat.push(...sortedGroup);
            });

            return { groupCounts: counts, flatSessions: flat, groupDates: sortedDates };
        }, [displayedSessions]);

        // Formatters (Moved inside or kept outside, fine here)
        const formatTime = (milliseconds: number) => {
            const totalSeconds = Math.floor(milliseconds / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            if (hours > 0) return `${hours}h ${minutes}m`;
            return `${minutes}m`;
        };

        const formatDate = (dateString: string) => {
            const date = new Date(dateString);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (date.toDateString() === today.toDateString()) return 'Today';
            if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };

        const formatDateTime = (timestamp: number) => {
            return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        };

        // ✅ SMART LOADING STATE:
        // Only show Skeleton if we are loading AND we have 0 sessions.
        // If we have cached sessions (stale), show them immediately (isLoading is true, but sessions.length > 0).
        // const shouldShowSkeleton = isLoading && (!sessions || sessions.length === 0);
        const shouldShowSkeleton = isLoading && (!sessionList || sessionList.length === 0);
        const hasActiveFilters = debouncedSearch !== '' || activityFilter !== 'All' || sourceFilter !== 'All' || topicFilter !== 'All' || startDate || endDate;


        if (shouldShowSkeleton) {
            return <SessionsListSkeleton />;
        }

        if (!sessionList || sessionList.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No sessions yet. Start your first session to begin tracking!</p>
                </div>
            );
        }

        // Create a unique hash of the current filter state
        const filterKey = `${displayedSessions.length}-${debouncedSearch}-${activityFilter}-${sourceFilter}-${topicFilter}`;

        return (
            // Height is handled by useWindowScroll, but we need a wrapper min-height to prevent collapse

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative items-start">

                {/* THE FILTER BAR */}
                <div className="col-span-5 bg-background/95 backdrop-blur p-4 rounded-lg border shadow-sm space-y-4 sticky top-24 z-20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="relative md:col-span-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search title or notes..."
                                className="pl-9"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </div>

                        <Select value={activityFilter} onValueChange={setActivityFilter}>
                            <SelectTrigger><SelectValue placeholder="Activity" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Activities</SelectItem>
                                {filterOptions.activities.map(act => <SelectItem key={act} value={act}>{act}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                            <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Sources</SelectItem>
                                {filterOptions.sources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={topicFilter} onValueChange={setTopicFilter}>
                            <SelectTrigger><SelectValue placeholder="Thread / Topic" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Threads</SelectItem>
                                {filterOptions.topics.map(topic => <SelectItem key={topic} value={topic}># {topic}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        {/* NEW: TIME RANGE SELECTOR */}
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger><SelectValue placeholder="Time Range" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Time</SelectItem>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* NEW: CUSTOM DATE RANGE PICKER */}
                    <div className="flex items-center space-x-2 md:col-span-1">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-lg"
                            title="Start Date"
                        />
                        <span className="text-muted-foreground text-xs">-</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-lg"
                            title="End Date"
                        />
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-center justify-between pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                                Showing {displayedSessions.length} result{displayedSessions.length !== 1 ? 's' : ''}
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setDebouncedSearch(''); setActivityFilter('All'); setSourceFilter('All'); setTopicFilter('All'); setStartDate(''); setEndDate('');
                                }}
                                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <X className="mr-1 h-3 w-3" /> Clear Filters
                            </Button>
                        </div>
                    )}


                    {timeRange && (
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-sm font-semibold text-muted-foreground">Time Range Filters</h2>
                            {/* NEW: ONE-CLICK EXPORT BUTTON */}
                            <Button variant="outline" size="sm" onClick={handleCopyForAI} className="border-[#8A2BE2]/50 text-[#8A2BE2] hover:bg-[#8A2BE2]/10 h-8">
                                <FileText className="w-4 h-4 mr-2" />
                                Export Filtered to AI
                            </Button>
                        </div>
                    )}
                </div>

                {/* LEFT COLUMN: MASTER LIST (60%) */}
                <div className="space-y-4 col-span-2">
                    {/* THE VIRTUALIZED LIST */}
                    {displayedSessions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
                            <Filter className="mx-auto h-8 w-8 mb-3 opacity-30" />
                            <p>No sessions match your filters.</p>
                        </div>
                    ) : (<div className="min-h-[500px]">
                        <GroupedVirtuoso
                            key={filterKey}
                            useWindowScroll
                            overscan={500}
                            groupCounts={groupCounts}

                            // Renders the Date Header
                            groupContent={(index) => {
                                const date = groupDates[index];
                                const count = groupCounts[index];
                                return (

                                    // 1. STICKY OFFSET: 'top-14' (3.5rem) accounts for main Dashboard Navbar. 
                                    //    Adjust this value (e.g. top-16, top-0) based on your actual nav height.
                                    // 2. Z-INDEX: 'z-20' ensures it stays above the session cards (usually z-0 or z-10).
                                    // 3. SOLID BG: Removed backdrop-blur in favor of solid background to prevent "bleed through".

                                    <div className="sticky z-20 pst-16 pb-2 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm">
                                        {/* Inner Container for alignment */}
                                        <div className="flex items-center space-x-2 text-muted-foreground pt-2 pb-0">
                                            <Calendar className="h-4 w-4" />
                                            <span>{formatDate(date)}</span>
                                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">({count} session{count !== 1 ? 's' : ''})</span>
                                        </div>
                                    </div>
                                );
                            }}

                            // Renders the Session Card
                            // itemContent={(index) => {
                            //     const session = flatSessions[index];
                            //     const isSelected = selectedIds.has(session.id);

                            //     // const typeInfo = getSessionTypeInfo(session.type);
                            //     // --- FALLBACK LOGIC FOR LEGACY DATA ---
                            //     // If it's an old session, it won't have `session.tags`. We map the old `type` to `activity`.
                            //     const activity = session.tags?.activity || 'Other';
                            //     const source = session.tags?.source;
                            //     const topics = session.tags?.topic || [];

                            //     return (
                            //         <div className="pb-3"> {/* Spacing between cards */}
                            //             <div className="pt-4">
                            //                 <Input
                            //                     placeholder="Checkbox for bulk selection"
                            //                     type="checkbox"
                            //                     className="w-5 h-5 cursor-pointer accent-[#8A2BE2]"
                            //                     checked={isSelected}
                            //                     onChange={() => toggleSelection(session.id)}
                            //                 />
                            //             </div>
                            //             <Card className={`flex-1 transition-shadow hover:shadow-md ${isSelected ? 'ring-2 ring-[#8A2BE2]/50' : ''}`}>
                            //                 <CardContent className="p-4 grid grid-cols-2 gap-2">
                            //                     <div className="col-span-2 flex items-start justify-between mb-3">
                            //                         <div className="flex justify-center items-center space-x-3">
                            //                             <div className="flex-1">
                            //                                 <h3 className="font-medium mb-1">
                            //                                     <HighlightMatch text={session.title || 'Untitled Session'} highlight={debouncedSearch} />
                            //                                 </h3>
                            //                                 <div className="flex items-center space-x-2 text-muted-foreground">
                            //                                     <span>{formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}</span>
                            //                                 </div>
                            //                             </div>
                            //                         </div>
                            //                     </div>

                            //                     <div className="col-span-2 flex items-center justify-start space-x-4 mb-3 text-muted-foreground">
                            //                         <div className="flex items-center space-x-1">
                            //                             <Clock className="h-4 w-4" />
                            //                             <span>Focus: {formatTime(session.sessionTime)}</span>
                            //                         </div>
                            //                         {session.breakTime > 0 && (
                            //                             <div className="flex items-center space-x-1">
                            //                                 <Clock className="h-4 w-4" />
                            //                                 <span>Break: {formatTime(session.breakTime)}</span>
                            //                             </div>
                            //                         )}
                            //                     </div>

                            //                     {/* NOTES BLOCK */}
                            //                     {session.notes && (
                            //                         <div className="col-span-2 mt-2 p-3 bg-muted/50 rounded-md text-lg border border-border/50">
                            //                             {debouncedSearch.trim() !== '' ? (
                            //                                 // SEARCH MODE: Prioritize finding the exact match
                            //                                 <div className="whitespace-pre-wrap font-mono text-lg">
                            //                                     <HighlightMatch text={session.notes} highlight={debouncedSearch} />
                            //                                 </div>
                            //                             ) : (
                            //                                 // READ MODE: Prioritize the beautiful Markdown formatting
                            //                                 <div className="prose prose-lg dark:prose-invert max-w-none">
                            //                                     {/* <SafeMarkdown content={session.notes} /> */}
                            //                                 </div>
                            //                             )}
                            //                         </div>
                            //                     )}

                            //                     {/* {session.notes && (
                            //                         <div className="col-span-2 flex items-start space-x-2 mt-2 p-3 border border-border/50 rounded-md bg-muted/50">
                            //                             <FileText className="h-4 w-4 mt-1 shrink-0" />
                            //                             <div className="whitespace-pre-wrap font-mono text-lg flex-1 overflow-auto">
                            //                                 <HighlightMatch text={session.notes} highlight={debouncedSearch} />
                            //                             </div>
                            //                         </div>
                            //                     )} */}

                            //                     {/* --- NEW HYBRID TAG RENDERING --- */}
                            //                     <div className="col-span-2 relative flex items-center justify-between mt-4 border-t pt-4">
                            //                         <div className="flex flex-wrap gap-2">
                            //                             {/* Y-Axis: The Constraints */}
                            //                             <Badge variant="default" className="bg-[#8A2BE2] hover:bg-[#5D3FD3]">
                            //                                 {activity}
                            //                             </Badge>

                            //                             {source && (
                            //                                 <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                            //                                     {source}
                            //                                 </Badge>
                            //                             )}

                            //                             {/* X-Axis: The Threads */}
                            //                             {topics.map((topicStr, i) => (
                            //                                 <Badge key={i} variant="secondary" className="bg-muted">
                            //                                     # {topicStr}
                            //                                 </Badge>
                            //                             ))}
                            //                         </div>

                            //                         <div className="flex items-center justify-center space-x-2">
                            //                             <Button variant="destructive" className="p-1 h-8 w-8" onClick={() => onRequestDelete(session)}>
                            //                                 <Trash2 size={16} />
                            //                             </Button>
                            //                             <Button onClick={() => onEdit(session)} className="p-1 h-8 w-8" variant="ghost">
                            //                                 <Edit size={16} />
                            //                             </Button>
                            //                         </div>
                            //                     </div>

                            //                     {/* Old */}
                            //                     {/* <div className="col-span-2 relative flex items-center justify-between mt-4">
                            //   <Badge variant="default" className="capitalize" style={{ backgroundColor: typeInfo.color }}>
                            //     {typeInfo.label}
                            //   </Badge>
                            //   <div className="flex items-center justify-center space-x-2">
                            //     <Button variant="destructive" className="p-1 h-8 w-8" onClick={() => onRequestDelete(session)}>
                            //       <Trash2 size={16} />
                            //     </Button>
                            //     <Button onClick={() => onEdit(session)} className="p-1 h-8 w-8" variant="ghost">
                            //       <Edit size={16} />
                            //     </Button>
                            //   </div>
                            // </div> */}
                            //                 </CardContent>
                            //             </Card>
                            //         </div>
                            //     );
                            // }}
                            // Renders the Compact Session Row
                            itemContent={(index) => {
                                const session = flatSessions[index];
                                const isSelected = selectedIds.has(session.id);

                                const activity = session.tags?.activity || 'Other';
                                // We will map activities to colors globally later. For now, default to DeepSession Purple.
                                const activityColor = activity === 'Coding' ? 'bg-[#8A2BE2]' : 'bg-blue-500';

                                return (
                                    <div className="px-2 py-1">
                                        <div
                                            className={`group flex items-stretch gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-[#8A2BE2]/5 border-[#8A2BE2]/50' : 'bg-card hover:bg-muted/50 border-border/50'
                                                }`}
                                            onClick={() => setSelectedInspectorSession(session)}
                                        >
                                            {/* 1. Batch Selection Checkbox */}
                                            <div className="flex items-center pt-1">
                                                <input
                                                    title="Shift-click to select a range"
                                                    type="checkbox"
                                                    className="w-4 h-4 cursor-pointer accent-[#8A2BE2] rounded-sm"
                                                    checked={isSelected}
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevents opening the inspector when just checking the box
                                                        // toggleSelection(session.id, index, e.shiftKey);
                                                        toggleSelection(session.id);
                                                    }}
                                                    onChange={() => { }}
                                                />
                                            </div>

                                            {/* 2. Visual Anchor (Activity Color Bar) */}
                                            <div className={`w-1 rounded-full ${activityColor} opacity-70`} />

                                            {/* 3. Core Data (Title & Time) */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center justify-between gap-4">

                                                    {/* Left: Title & Tags */}
                                                    {/* <div className="truncate flex-1">
                                                        <h3 className="font-semibold text-sm truncate">
                                                            <HighlightMatch text={session.title || 'Untitled Session'} highlight={debouncedSearch} />
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span>{formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}</span>
                                                            <span className="text-border/50">•</span>
                                                            <span className="truncate">{activity}</span>
                                                        </div>
                                                    </div> */}

                                                    {/* Right: Focus Metrics */}
                                                    {/* <div className="flex flex-col items-end shrink-0">
                                                        <span className="font-mono text-sm font-medium">
                                                            {formatTime(session.sessionTime)}
                                                        </span>
                                                        {session.breakTime > 0 && (
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <Clock className="w-3 h-3" /> {formatTime(session.breakTime)} brk
                                                            </span>
                                                        )}
                                                    </div> */}

                                                    {/* Left: Title & Tags */}
                                                    <div className="truncate flex-1">
                                                        <h3 className="font-semibold text-sm truncate flex items-center gap-2">
                                                            <HighlightMatch text={session.title || 'Untitled Session'} highlight={debouncedSearch} />

                                                            {/* NEW: THE NOTES BADGE */}
                                                            {session.notes && session.notes.trim().length > 0 && (
                                                                <FileText className="w-3 h-3 text-muted-foreground opacity-60" name="Contains Notes" />
                                                            )}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span>{formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}</span>
                                                            <span className="text-border/50">•</span>
                                                            <span className="truncate">{activity}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </div>)}

                    {/* FLOATING BATCH ACTION BAR */}
                    {/* {selectedIds.size > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-lg rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-5">
                            <span className="text-sm font-medium bg-[#8A2BE2]/10 text-[#8A2BE2] px-3 py-1 rounded-full">
                                {selectedIds.size} selected
                            </span>
                            <Button variant="ghost" size="sm" onClick={clearSelection}>
                                Cancel
                            </Button>

                            <Button variant="outline" size="sm" onClick={handleCopyForAI} className="border-[#8A2BE2]/50 hover:bg-[#8A2BE2]/10">
                                Copy for AI
                            </Button>

                            <Button size="sm" className="bg-[#8A2BE2] hover:bg-[#5D3FD3]" onClick={() => setIsBatchModalOpen(true)}>
                                Batch Edit Tags
                            </Button>
                        </div>
                    )} */}

                    {/* BATCH EDIT MODAL */}
                    <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Batch Update {selectedIds.size} Sessions</DialogTitle>
                                <DialogDescription>
                                    Warning: This will overwrite the existing tags for all selected sessions.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                {/* TOPICS: Text Input + Clickable Badges */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="batch-topics" className="text-right">Topics</Label>
                                    <div className="col-span-3 space-y-2">
                                        <Input
                                            id="batch-topics"
                                            value={batchTopics}
                                            onChange={(e) => setBatchTopics(e.target.value)}
                                            placeholder="Leave blank to keep existing topics..."
                                            className="col-span-3"
                                        />
                                        {/* QUICK ADD PILLS: Click to append existing topics */}
                                        {filterOptions.topics.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {filterOptions.topics.map(topic => (
                                                    <Badge
                                                        key={topic}
                                                        variant="secondary"
                                                        className="cursor-pointer hover:bg-[#8A2BE2] hover:text-white transition-colors"
                                                        onClick={() => {
                                                            // Smart append: don't add if it's already there
                                                            const current = batchTopics.split(',').map(t => t.trim()).filter(Boolean);
                                                            if (!current.includes(topic)) {
                                                                setBatchTopics(current.length ? `${batchTopics}, ${topic}` : topic);
                                                            }
                                                        }}
                                                    >
                                                        + {topic}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {/* THE MERGE CONTROLLER */}
                                        {batchTopics.trim() !== '' && (
                                            <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-md border text-sm">
                                                <input
                                                    type="checkbox"
                                                    id="append-toggle"
                                                    checked={isAppendingTopics}
                                                    onChange={(e) => setIsAppendingTopics(e.target.checked)}
                                                    className="accent-[#8A2BE2] w-4 h-4 cursor-pointer"
                                                />
                                                <label htmlFor="append-toggle" className="cursor-pointer font-medium">
                                                    {isAppendingTopics
                                                        ? "Keep existing topics and add these"
                                                        : <span className="text-destructive font-bold">Overwrite all existing topics</span>}
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ACTIVITY: Native HTML Datalist (Autocomplete + Custom) */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="batch-activity" className="text-right">Activity</Label>
                                    <div className="col-span-3">
                                        {/* <Input
                                        id="batch-activity"
                                        // list="existing-activities" // Connects to the datalist below
                                        value={batchActivity}
                                        onChange={(e) => setBatchActivity(e.target.value as ActivityType)}
                                        placeholder="Leave blank to keep existing..."
                                    /> */}
                                        {/* <datalist id="existing-activities">
                                        {filterOptions.activities.map(act => (
                                            <option key={act} value={act} />
                                        ))}
                                    </datalist> */}
                                        <AutocompleteInput
                                            value={batchActivity}
                                            onChange={setBatchActivity}
                                            options={filterOptions.activities}
                                            placeholder="Leave blank to keep existing..."
                                        />
                                    </div>
                                </div>

                                {/* SOURCE: Native HTML Datalist */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="batch-source" className="text-right">Source</Label>
                                    <div className="col-span-3">
                                        {/* <Input
                                        // id="batch-source"
                                        // list="existing-sources"
                                        value={batchSource}
                                        onChange={(e) => setBatchSource(e.target.value as SourceType)}
                                        placeholder="Leave blank to keep existing..."
                                    /> */}
                                        {/* <datalist id="existing-sources">
                                        {filterOptions.sources.map(src => (
                                            <option key={src} value={src} />
                                        ))}
                                    </datalist> */}
                                        <AutocompleteInput
                                            value={batchSource}
                                            onChange={setBatchSource}
                                            options={filterOptions.sources}
                                            placeholder="Leave blank to keep existing..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsBatchModalOpen(false)}>Cancel</Button>
                                <Button
                                    className="bg-[#8A2BE2] hover:bg-[#5D3FD3]"
                                    onClick={() => {

                                        const parsedTopics = batchTopics.split(',').map(t => t.trim()).filter(Boolean);

                                        const intent: BatchUpdateIntent = {
                                            appendTopics: isAppendingTopics,
                                        };

                                        // Only attach fields if the user actually typed something
                                        if (parsedTopics.length > 0) intent.topics = parsedTopics;
                                        if (batchActivity.trim() !== '') intent.activity = batchActivity.trim();
                                        if (batchSource.trim() !== '') intent.source = batchSource.trim();

                                        // 2. Prevent empty batches
                                        if (Object.keys(intent).length === 1) { // Only appendTopics is there
                                            toast.error("Nothing to update", { description: "All fields are blank." });
                                            return;
                                        }

                                        // 3. Fire mutation
                                        updateMultipleSessionsTag({
                                            ids: Array.from(selectedIds),
                                            intent,
                                        });

                                        // 4. Cleanup
                                        setIsBatchModalOpen(false);
                                        clearSelection();
                                    }}
                                >
                                    Apply to {selectedIds.size} Sessions
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* RIGHT COLUMN */}
                <div className="hidden lg:block lg:col-span-3 sticky top-24 h-[calc(100vh-8rem)]">
                    {selectedIds.size > 0 ? (
                        <BatchEditorPanel
                            selectedCount={selectedIds.size}
                            filterOptions={filterOptions}
                            onCancel={clearSelection}
                            onApply={(intent) => {
                                updateMultipleSessionsTag({
                                    ids: Array.from(selectedIds),
                                    intent,
                                });
                                clearSelection();
                            }}
                        />
                    ) : selectedInspectorSession ? (
                        <SessionInspector
                            session={selectedInspectorSession}
                            onClose={() => setSelectedInspectorSession(null)}
                            onUpdate={(id, updates) => {
                                updateSession({ id, updates });
                                setSelectedInspectorSession(prev => prev ? { ...prev, ...updates } : null);
                            }}
                        />
                    ) : (
                        // <div className="h-full border border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                        //     <FileText className="w-12 h-12 mb-4 opacity-20" />
                        //     <p className="text-sm">Select a session to view or edit details</p>
                        // </div>
                        <EmptyInspectorState />
                    )}
                </div>
            </div>
        );
    }
);

export default function SessionLog() {
    const { userId } = useDashboard();
    const { mutate: updateSession, isPending: isUpdating } = useUpdateSession(userId);
    const { mutate: deleteSession, isPending: isDeleting } = useDeleteSession(userId);

    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newNotes, setNewNotes] = useState(''); // ADDED: Local state for notes
    const [deleteCandidate, setDeleteCandidate] = useState<Session | null>(null);

    // New state vars
    const [editActivity, setEditActivity] = useState('');
    const [editSource, setEditSource] = useState('');
    const [editTopics, setEditTopics] = useState(''); // Stores comma-separated string

    // --- STABLE HANDLERS ---
    // Must use useCallback so SessionsContent doesn't see "new" functions on every render
    const handleEditClick = useCallback((session: Session) => {
        setEditingSession(session);
        setNewTitle(String(session.title || ''));
        setNewNotes(String(session.notes || '')); // ADDED: Init notes

        // Hydrate tags for editing
        setEditActivity(session.tags?.activity || '');
        setEditSource(session.tags?.source || '');
        setEditTopics((session.tags?.topic || []).join(', '));
    }, []);

    const handleSaveEdit = () => {
        if (!editingSession) return;
        // Construct updates object
        const updates: Partial<Session> = {};
        if (newTitle.trim() !== '') updates.title = newTitle;
        // Always update notes if they changed (even to empty)
        if (newNotes !== editingSession.notes) updates.notes = newNotes;

        // Compile the new tags
        const parsedTopics = editTopics.split(',').map(t => t.trim()).filter(Boolean);
        updates.tags = {
            topic: parsedTopics,
            activity: editActivity,
            source: editSource
        };

        if (Object.keys(updates).length > 0) {
            updateSession({ id: editingSession.id, updates });
        }
        setEditingSession(null);
    };

    const handleRequestDelete = useCallback((session: Session) => {
        setDeleteCandidate(session);
    }, []);

    const handleConfirmDelete = () => {
        if (!deleteCandidate) return;
        deleteSession(deleteCandidate.id);
        setDeleteCandidate(null);
    };


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Your session logs and activity history.</p>
                </CardContent>
            </Card>

            {/* <Suspense fallback={<SessionsListSkeleton />}> */}
            {/* Suspense is great, but our manual check above covers the 'cache miss' scenario better for this specific case */}
            <SessionsContent onEdit={handleEditClick} onRequestDelete={handleRequestDelete} />
            {/* </Suspense> */}

            <Dialog open={!!editingSession} onOpenChange={(isOpen) => !isOpen && setEditingSession(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit session details</DialogTitle>
                        <DialogDescription>Update the title or notes for this session.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <Input
                                id="title"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="topics" className="text-right">Topics</Label>
                            <Input
                                id="topics"
                                value={editTopics}
                                onChange={(e) => setEditTopics(e.target.value)}
                                placeholder="JS Internals, Freelance, etc (comma separated)"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="activity" className="text-right">Activity</Label>
                            <Input
                                id="activity"
                                value={editActivity}
                                onChange={(e) => setEditActivity(e.target.value)}
                                className="col-span-3"
                            />
                        </div>

                        {/* ADDED: Notes Field */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="notes" className="text-right mt-3">Notes</Label>
                            <Textarea
                                id="notes"
                                value={newNotes}
                                onChange={(e) => setNewNotes(e.target.value)}
                                // ADDED: max-h-[40vh] (max 40% of viewport) and overflow-y-auto
                                className="col-span-3 min-h-[100px] max-h-[40vh] overflow-y-auto resize-none"
                                placeholder="Session summary (Markdown supported)"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingSession(null)}>Cancel</Button>
                        <Button
                            onClick={handleSaveEdit}
                        // disabled={isUpdating}
                        >Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete your session: <br />
                            "{deleteCandidate?.title || 'Untitled Session'}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteCandidate(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}