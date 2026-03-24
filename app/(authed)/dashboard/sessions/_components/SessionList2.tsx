// _components/SessionList.tsx
import React from 'react';
import { GroupedVirtuoso } from "react-virtuoso";
import { Calendar, FileText, Filter, Clock } from 'lucide-react';
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

const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

// --- CUSTOM VIRTUALIZED SCROLLER ---
// Forwards the ref so Virtuoso can perfectly calculate item heights and scroll positions
const CustomScroller = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
    ({ style, ...props }, ref) => {
        return (
            <div
                {...props}
                ref={ref}
                className="custom-scrollbar" // Your custom CSS scrollbar class
                style={{
                    ...style,
                    height: '90vh',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}
            />
        );
    }
);
CustomScroller.displayName = 'CustomScroller';

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
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                <Filter className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm">No sessions match your filters.</p>
            </div>
        );
    }

    // THE VIRTUALIZED ENGINE
    return (
        // <div className="min-h-[500px]">
            <GroupedVirtuoso
                key={`${displayedSessions.length}-${debouncedSearch}`}
                className="h-full w-full"
                // useWindowScroll
                // NEW: The precisely mounted custom scroller
                components={{
                    Scroller: CustomScroller
                }}
                overscan={500}
                groupCounts={groupCounts}

                // Renders the Date Header
                groupContent={(index) => {
                    const date = groupDates[index];
                    const count = groupCounts[index];
                    return (
                        <div className="sticky tsop-24 z-20 pt-8 pb-4 bg-background/95 backdrop-blur shadow-sm border-b px-3 py-2">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(date)}</span>
                                <span className="opacity-60 font-normal normal-case">
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
                                className={`group flex items-stretch gap-3 p-3 rounded-md border transition-all cursor-pointer ${isSelected ? 'bg-[#8A2BE2]/5 border-[#8A2BE2]/50' :
                                    isInspected ? 'bg-muted border-border shadow-sm' :
                                        'bg-card hover:bg-muted/30 border-transparent hover:border-border/50'
                                    }`}
                                onClick={() => onSelectSession(session)}
                            >
                                {/* 1. Batch Selection Checkbox */}
                                <div className="flex items-center pt-0.5">
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
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">

                                    {/* Left Side: Title & Tags */}
                                    <div className="truncate flex-1">
                                        <h3 className="font-semibold text-sm truncate flex items-center gap-2 text-foreground/90 group-hover:text-foreground transition-colors">
                                            <HighlightMatch text={session.title || 'Untitled Session'} highlight={debouncedSearch} />
                                            {session.notes && session.notes.trim().length > 0 && (
                                                <FileText className="w-3 h-3 text-[#8A2BE2] opacity-70" name="Contains Notes" />
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-mono">
                                            <span>{formatDateTime(session.startTime)}</span>
                                            <span className="opacity-50">-</span>
                                            <span>{formatDateTime(session.endTime)}</span>
                                            <span className="text-border mx-1">•</span>
                                            <span className="truncate uppercase font-sans font-medium tracking-wide text-[10px]">{activity}</span>
                                        </div>
                                    </div>

                                    {/* Right Side: Time Metrics */}
                                    <div className="flex flex-col items-end shrink-0 justify-center">
                                        <span className="font-mono text-sm font-semibold text-foreground/80">
                                            {formatTime(session.sessionTime)}
                                        </span>
                                        {session.breakTime > 0 && (
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                                                <Clock className="w-2.5 h-2.5" /> {formatTime(session.breakTime)} brk
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }}
            />
        // {/* </div> */}
    );
}