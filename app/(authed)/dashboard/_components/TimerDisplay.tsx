"use client";

import { Button } from "@/components/ui/button";
import {
  Maximize2, CoffeeIcon, PlayIcon, StopCircleIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionTimer } from "@/hooks/controllers/useSessionTimer";
import { formatTime } from "@/lib/timeUtils";

interface TimerDisplayProps {
  isActive: boolean;
  isOnBreak: boolean;
  currentPhase: string;
  onToggleTimer?: () => void;
  onToggleBreak: () => void;
  onEndSession: () => void;
  onPip?: () => void; // Optional: Only Dashboard has this
  isPipActive?: boolean; // The Mode Switch
  status: string | 'idle' | 'running' | 'paused';
  isSaving?: boolean;
}

export function TimerDisplay({
  isActive,
  isOnBreak,
  currentPhase,
  onToggleTimer,
  onToggleBreak,
  onEndSession,
  onPip,
  status,
  isSaving,
  isPipActive = false,
}: TimerDisplayProps) {

  // ⚡ The Heart (Isolated 60fps Loop)
  const { sessionMs, breakMs } = useSessionTimer();
  const displayMs = isOnBreak ? breakMs : sessionMs;

  // const { status, isSaving } = useSessionController();

  // ---------------------------------------------------------
  // 🖥️ MODE 1: PiP / HUD (The Floating Widget)
  // ---------------------------------------------------------
  if (isPipActive) {
    return (
      // Root: Pure Black, Flex Center, Relative for overlay
      <div className="flex flex-row items-center justify-center w-full h-full bg-gray-900/10 text-white relative group overflow-hidden select-none cursor-default">

        <div className="flex flex-row justify-center items-center gap-4">
          {/* 1. The Time (Massive) */}
          {/* vw/vh units ensure it scales perfectly whether the window is 200px or 800px */}
          <div className={cn(
            "flex-item font-mono font-bold leading-none tracking-tighter tabular-nums z-10 transition-colors duration-300",
            "text-4xl",
            isOnBreak ? "text-blue-500" : "text-red-600"
          )}>
            {formatTime(displayMs)}
          </div>

          {/* Phase Badge */}
          <div className={cn(
            "border border-blue-400 flex-item text-sm font-semibold uppercase tracking-widest px-3 py-1 rounded-full animate-pulse",
            isOnBreak
              ? "bg-red-400/10 text-red-400 border-red-500/20"
              : "bg-green-400/10 text-green-400 border-green-500/20"
          )}>
            {isSaving ? 'Syncing...' : currentPhase}
          </div>
        </div>

        {/* 3. Ghost Controls (Overlay) */}
        {/* Hidden by default (opacity-0). Visible on Hover (group-hover:opacity-100) */}
        <div className="absolute insetd-0 w-screen h-screen flex items-center justify-center gap-4 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">

          {/* Break */}
          <Button
            onClick={onToggleBreak}
            variant="outline"
            size="sm"
            className={cn(
              "px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all cursor-pointer",
              status === 'running' ? "bg-yellow-600 hover:bg-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-500 text-gray-200 hover:text-white" : "bg-green-500 hover:bg-green-600 text-white hover:text-white dark:bg-green-600 dark:hover:bg-green-500"
            )}
          >
            {status === 'running' ? <CoffeeIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            <span>{status === 'running' ? 'Take Break' : 'Resume'}</span>
          </Button>

          {/* End Session */}
          <Button
            onClick={onEndSession}
            variant="destructive"
            size="sm"
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold flex items-center space-x-2 cursor-pointer hover:bg-red-600 transition-colors dark:hover:bg-red-600"
          >
            <StopCircleIcon className="w-5 h-5" />
            <span>End</span>
          </Button>
        </div>

        {/* 4. Drag Handle (Optional visual cue) */}
        <div className="absolute top-0 w-full h-2 bg-linear-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  // ---------------------------------------------------------
  // 🏠 MODE 2: Dashboard (Standard UI)
  // ---------------------------------------------------------
  return (
    <div className="flex flex-col items-center justify-center w-full py-8 relative bg-card rounded-xl border shadow-sm">

      {/* Pop Out Button (Top Right) */}
      <div className="absolute top-3 right-3">
        {onPip && (
          <Button variant="ghost" size="icon" onClick={onPip} className="text-muted-foreground hover:text-primary transition-colors">
            <Maximize2 className="w-5 h-5" />
            <span className="sr-only">Pop Out Timer</span>
          </Button>
        )}
      </div>

      {/* Phase Badge */}
      <div className="mb-4">
        <span className={cn(
          "text-sm font-semibold uppercase tracking-widest px-3 py-1 rounded-full border animate-pulse",
          isOnBreak
            ? "bg-red-400/10 text-red-400 border-red-500/20"
            : "bg-green-400/10 text-green-400 border-green-500/20"
        )}>
          {isSaving ? 'Syncing...' : currentPhase}
        </span>
      </div>

      {/* The Time (Standard Size) */}
      <div className={cn(
        "text-8xl font-bold font-mono tracking-tighter tabular-nums mb-10 transition-all duration-300 cursor-default select-none",
        // isOnBreak ? "text-red-600" : "text-blue-500",
        // !isActive && "opacity-60 scale-95 blur-[1px]"
      )}>
        {formatTime(displayMs)}
      </div>

      {/* <div className={`mb-4 transition-all duration-300 ${isOnBreak ? 'text-muted-foreground' : 'text-foreground'}`}>
        <div className="text-6xl font-mono tracking-tight">
          {formatTime(sessionMs)}
        </div>
        <div className="text-muted-foreground">Session Time</div>
      </div>

      {breakMs+1 > 0 && (
        <div className={`fclex item-center justify-center gap-2 mb-4 transition-all duration-300 ${isOnBreak ? 'text-foreground' : 'text-muted-foreground'}`}>
          <div className="text-xl font-mono tracking-tight">
            {formatTime(breakMs)}
          </div>
          <div className="text-muted-foreground">Break Time </div>
        </div>
      )} */}

      {/* Controls Row */}
      <div className="flex items-center gap-6">

        {/* Break Action */}
        <Button
          onClick={onToggleBreak}
          variant="outline"
          size="lg"
          className={cn(
            "px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all cursor-pointer",
            status === 'running' ? "bg-yellow-600 hover:bg-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-500 text-gray-200 hover:text-white" : "bg-green-500 hover:bg-green-600 text-white hover:text-white dark:bg-green-600 dark:hover:bg-green-500"
          )}
        >
          {status === 'running' ? <CoffeeIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          <span>{status === 'running' ? 'Take Break' : 'Resume'}</span>
        </Button>

        {/* End Action */}
        <Button
          onClick={onEndSession}
          variant="destructive"
          size="lg"
          className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold flex items-center space-x-2 cursor-pointer hover:bg-red-600 transition-colors dark:hover:bg-red-600"
        >
          <StopCircleIcon className="w-5 h-5" />
          <span>End</span>
        </Button>
      </div>
    </div>
  );
}