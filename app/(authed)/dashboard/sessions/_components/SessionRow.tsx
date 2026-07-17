import React from "react";
import type { Session } from "@/types";
import { Calendar, FileText, Filter, Clock, Badge } from 'lucide-react';
import HighlightMatch from '@/app/(authed)/dashboard/_components/HighlightMatch';
import { formatDurationCompact, formatTimeOfDay } from "@/lib/utils/time";


const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};


const SessionRow = React.memo(({
    session,
    activity,
    source,
    topics,
    debouncedSearch,
    isSelected,
    isInspectorActive,
    onToggle,
    onSelect,
}: {
    session: Session;
    activity: string;
    source: string;
    topics: string[];
    debouncedSearch: string;
    isSelected: boolean;
    isInspectorActive: boolean;
    onToggle: (id: string) => void;
    onSelect: (session: Session) => void
}) => {

    return (
        <div
            className={`group flex items-stretch gap-3 p-3 mb-4 rounded-md border transition-all cursor-pointer h-[72px] overflow-hidden ${isSelected ? 'bg-[#8A2BE2]/5 border-[#8A2BE2]/50' :
                isInspectorActive ? 'bg-muted border-border shadow-sm' :
                    'bg-card hover:bg-muted/30 border-transparent hover:border-border/50'
                }`}
            onClick={(e) => {

                // BUG FIX: If the user clicked a button (like the checkbox), DO NOT trigger the row selection.
                // This stops event bubbling collisions.
                if ((e.target as HTMLElement).closest('button')) {
                    return;
                }

                onSelect(session)
            }}
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
                        onToggle(session.id);
                    }}
                    onChange={() => { }}
                />
            </div>

            {/* 2. Visual Anchor */}
            <div className={`w-1 rounded-full ${activity} opacity-70`} />

            {/* NEW */}
            {/* 3. Core Data */}
            <div className=" flex-1 min-w-0 flex items-center justify-between gap-4">

                {/* Left Side: Title & Meta */}
                <div className="truncate flex-1 min-w-0">
                    <h3 className="font-semibold text-[15px] truncate flex items-center gap-2 text-foreground/90">
                        <HighlightMatch text={session.title || 'Untitled Session'} highlight={debouncedSearch} />
                    </h3>

                    <div className="flex items-center gap-2 mt-1.5 text-sm md:text-md text-muted-foreground  font-mono">
                        <span>{formatTimeOfDay(session.startTime)}</span>
                        <span className="opacity-30">-</span>
                        <span>{formatTimeOfDay(session.endTime)}</span>

                        {/* FIX 8: Notes icon moved to meta row so it doesn't clip with long titles */}
                        {session.notes && session.notes.trim().length > 0 && (
                            <>
                                <span className="text-border mx-1">•</span>
                                <FileText className="w-3.5 h-3.5 text-[#8A2BE2] opacity-80" name="Contains Notes" />
                            </>
                        )}
                    </div>
                </div>

                {/* Right Side: Badge & Time */}
                <div className="flex flex-col items-end shrink-0 justify-center gap-1.5">

                    {/* Right Side: Badge & Time */}
                    <div className="flex flex-col items-end shrink-0 justify-center gap-1.5 pl-4">

                        {/* The Badge Container */}
                        <div className="flex flex-wrap justify-end gap-1.5">

                            {/* 1. Activity Badge (Solid Purple) */}
                            <div className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-sans font-semibold bg-[#126df5] text-white whitespace-nowrap shadow-sm">
                                {activity}
                            </div>

                            {/* 2. Source Badge (Outlined) */}
                            {/* {source && (
                                <div className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-sans font-medium border border-muted-foreground/40 text-muted-foreground whitespace-nowrap">
                                    {source}
                                </div>
                            )} */}

                            {/* 3. Topics Badges (Muted Gray) */}
                            {/* {topics.map((topicStr, i) => {
                                if (!topicStr.trim()) return null; // Prevent empty pill rendering
                                return (
                                    <div key={i} className="text-[10px] tracking-wide px-1.5 py-0.5 rounded-sm font-sans font-medium bg-muted text-foreground/80 whitespace-nowrap">
                                        # {topicStr.trim()}
                                    </div>
                                );
                            })} */}
                        </div>

                        {/* Time Duration */}
                        {/* <span className="font-mono text-sm text-foreground font-semibold">
                            {formatDurationCompact(session.sessionTime)}
                        </span> */}

                        <div className="col-span-2 flex items-center justify-start space-x-4 mb-3 text-muted-foreground">
                            <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Focus: {formatDurationCompact(session.sessionTime)}</span>
                            </div>
                            {session.breakTime > 0 && (
                                <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Break: {formatDurationCompact(session.breakTime)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
});

SessionRow.displayName = 'SessionRow';

export default SessionRow;
