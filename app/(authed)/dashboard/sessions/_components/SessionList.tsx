// _components/SessionList.tsx
import React from 'react';
import { useCallback } from "react";
import { GroupedVirtuoso } from "react-virtuoso";
import { Calendar, FileText, Filter, Clock, Badge } from 'lucide-react';
import HighlightMatch from '@/app/(authed)/dashboard/_components/HighlightMatch';
import SessionRow from "./SessionRow"
import { Session } from '@/types';
import { formatRelativeDate } from "@/lib/utils/time";

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
                    height: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}
            />
        );
    }
);
CustomScroller.displayName = 'CustomScroller';

// SessionRow.displayName = 'SessionRow';

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

    // // EMPTY STATE
    // if (displayedSessions.length === 0) {
    //     return (
    //         <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
    //             <Filter className="h-8 w-8 mb-3 opacity-30" />
    //             <p className="text-sm">No sessions match your filters.</p>
    //         </div>
    //     );
    // }

    // 1. STRICTLY MEMOIZE THE RENDERER
    // This stops Virtuoso from destroying and rebuilding the engine on every keystroke
    const renderItem = useCallback((index: number) => {
        const session = flatSessions[index];
        if (!session) return null;
        const activity = session.tags?.activity || 'Other';
        // Put this near the top of your SessionRow where you define `activity`
        const source = session.tags?.source;
        const topics = session.tags?.topic ? (Array.isArray(session.tags.topic) ? session.tags.topic : [session.tags.topic]) : [];

        return (
            <SessionRow
                session={session}
                activity={activity}
                source={source}
                topics={topics}
                debouncedSearch={debouncedSearch}
                isSelected={selectedIds.has(session.id)}
                isInspectorActive={selectedInspectorId === session.id}
                onToggle={onToggleSelection}
                onSelect={onSelectSession}
            />
        );
    }, [flatSessions, debouncedSearch, selectedIds, selectedInspectorId, onToggleSelection, onSelectSession]);

    // 2. MEMOIZE THE GROUP HEADER
    const renderGroup = useCallback((index: number) => {
        return (
            <div className="bg-background/95 backdrop-blur z-10 py-2 border-b font-semibold text-sm text-muted-foreground sticky top-0">
                {formatRelativeDate(groupDates[index], "long")}
                <span className="ml-2 text-xs font-normal opacity-60">
                    ({groupCounts[index]} sessions)
                </span>
            </div>
        );
    }, [groupDates, groupCounts]);


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
            className="h-[80%] w-full"
            // useWindowScroll
            // NEW: The precisely mounted custom scroller
            components={{
                Scroller: CustomScroller
            }}
            overscan={400}
            groupCounts={groupCounts}
            groupContent={renderGroup}
            itemContent={renderItem}
        />
    );
}