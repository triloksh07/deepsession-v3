// _components/SessionList.tsx
import React from 'react';
import { GroupedVirtuoso } from "react-virtuoso";
import { Calendar, FileText, Filter } from 'lucide-react';
import HighlightMatch from '@/app/(authed)/dashboard/_components/HighlightMatch';
import { Session } from '@/types';

// --- FORMATTERS ---
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

const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

interface SessionListProps {
    displayedSessions: Session[];
    groupCounts: number[];
    groupDates: string[];
    flatSessions: Session[];
    selectedIds: Set<string>;
    debouncedSearch: string;
    selectedInspectorId?: string;
    onToggleSelection: (id: string) => void;
    onSelectSession: (session: Session) => void;
}

export function SessionList({
    displayedSessions,
    groupCounts,
    groupDates,
    flatSessions,
    selectedIds,
    debouncedSearch,
    selectedInspectorId,
    onToggleSelection,
    onSelectSession
}: SessionListProps) {
    
    // EMPTY STATE
    if (displayedSessions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
                <Filter className="mx-auto h-8 w-8 mb-3 opacity-30" />
                <p>No sessions match your filters.</p>
            </div>
        );
    }

    // THE VIRTUALIZED ENGINE
    return (
        <div className="min-h-[500px]">
            <GroupedVirtuoso
                key={`${displayedSessions.length}-${debouncedSearch}`}
                useWindowScroll
                overscan={500}
                groupCounts={groupCounts}

                // Renders the Date Header
                groupContent={(index) => {
                    const date = groupDates[index];
                    const count = groupCounts[index];
                    return (
                        <div className="sticky z-20 pt-1 pb-2 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm top-24">
                            <div className="flex items-center space-x-2 text-muted-foreground pt-2 pb-0">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(date)}</span>
                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                    ({count} session{count !== 1 ? 's' : ''})
                                </span>
                            </div>
                        </div>
                    );
                }}

                // Renders the Compact Session Row
                itemContent={(index) => {
                    const session = flatSessions[index];
                    const isSelected = selectedIds.has(session.id);
                    const isInspected = selectedInspectorId === session.id;

                    const activity = session.tags?.activity || 'Other';
                    const activityColor = activity === 'Coding' ? 'bg-[#8A2BE2]' : 'bg-blue-500';

                    return (
                        <div className="px-2 py-1">
                            <div
                                className={`group flex items-stretch gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                    isSelected ? 'bg-[#8A2BE2]/5 border-[#8A2BE2]/50' : 
                                    isInspected ? 'bg-muted border-border shadow-sm' : 
                                    'bg-card hover:bg-muted/50 border-border/50'
                                }`}
                                onClick={() => onSelectSession(session)}
                            >
                                {/* 1. Batch Selection Checkbox */}
                                <div className="flex items-center pt-1">
                                    <input
                                        title="Shift-click to select a range"
                                        type="checkbox"
                                        className="w-4 h-4 cursor-pointer accent-[#8A2BE2] rounded-sm"
                                        checked={isSelected}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleSelection(session.id);
                                        }}
                                        onChange={() => { }}
                                    />
                                </div>

                                {/* 2. Visual Anchor */}
                                <div className={`w-1 rounded-full ${activityColor} opacity-70`} />

                                {/* 3. Core Data */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="truncate flex-1">
                                            <h3 className="font-semibold text-sm truncate flex items-center gap-2">
                                                <HighlightMatch text={session.title || 'Untitled Session'} highlight={debouncedSearch} />
                                                {session.notes && session.notes.trim().length > 0 && (
                                                    <FileText className="w-3 h-3 text-muted-foreground opacity-60" />
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
        </div>
    );
}