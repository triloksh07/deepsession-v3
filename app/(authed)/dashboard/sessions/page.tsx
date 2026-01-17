'use client';

import React, { Suspense, useState, useCallback, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, FileText, Edit, Trash2 } from 'lucide-react';
import type { Session } from '@/types';
import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config';
import { useUpdateSession, useDeleteSession } from '@/hooks/CRUD/useSessionMutations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // IMPORTED
import { useDashboard } from '../_components/DashboardProvider';
import { SafeMarkdown } from '@/components/SafeMarkdown';
import { GroupedVirtuoso } from "react-virtuoso";

const sessionTypeMap = new Map<string, { label: string; color: string }>(
  DEFAULT_SESSION_TYPES.map((type) => [type.id, { label: type.label, color: type.color }])
);
const getSessionTypeInfo = (id: string) => sessionTypeMap.get(id) || { label: id, color: '#808080' };

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
    const { sessions: sessionList, isLoading } = useDashboard();
    const sessions = useMemo(() => {
      return sessionList ?? [];
    }, [sessionList]);

    // Memoize the flat list data structure for GroupedVirtuoso
    // It needs: 
    // 1. groupCounts: [2, 5, 1] (2 items in day 1, 5 in day 2...)
    // 2. flatSessions: [s1, s2, s3...] (All sessions flattened)
    // 3. groupDates: ['2023-10-01', '2023-09-30'...] (Headers)
    const { groupCounts, flatSessions, groupDates } = useMemo(() => {
      const list = sessions ?? [];

      // 1. Group
      const groups = list.reduce((acc: Record<string, Session[]>, session) => {
        const date = session.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(session);
        return acc;
      }, {});

      // 2. Sort Dates
      const sortedDates = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      // 3. Flatten
      const counts: number[] = [];
      const flat: Session[] = [];

      sortedDates.forEach((date) => {
        // Sort sessions inside the group
        const sortedGroup = groups[date].sort((a, b) => b.startTime - a.startTime);
        counts.push(sortedGroup.length);
        flat.push(...sortedGroup);
      });

      return { groupCounts: counts, flatSessions: flat, groupDates: sortedDates };
    }, [sessions]);

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
    const shouldShowSkeleton = isLoading && (!sessions || sessions.length === 0);

    if (shouldShowSkeleton) {
      return <SessionsListSkeleton />;
    }

    if (!sessions || sessions.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No sessions yet. Start your first session to begin tracking!</p>
        </div>
      );
    }

    return (
      // Height is handled by useWindowScroll, but we need a wrapper min-height to prevent collapse
      <div className="min-h-[500px]">
        <GroupedVirtuoso
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

              <div className="sticky z-20 pt-16 pb-2 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm">
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
          itemContent={(index) => {
            const session = flatSessions[index];
            const typeInfo = getSessionTypeInfo(session.type);

            return (
              <div className="pb-3"> {/* Spacing between cards */}
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4 grid grid-cols-2 gap-2">
                    <div className="col-span-2 flex items-start justify-between mb-3">
                      <div className="flex justify-center items-center space-x-3">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1 truncate">{session.title}</h3>
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <span>{formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-start space-x-4 mb-3 text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Focus: {formatTime(session.sessionTime)}</span>
                      </div>
                      {session.breakTime > 0 && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Break: {formatTime(session.breakTime)}</span>
                        </div>
                      )}
                    </div>

                    {session.notes && (
                      <div className="col-span-2 flex items-start space-x-2 text-muted-foreground mt-2">
                        <FileText className="h-4 w-4 mt-1 shrink-0" />
                        <div className="flex-1 text-sm overflow-hidden">
                          <SafeMarkdown content={session.notes} />
                        </div>
                      </div>
                    )}

                    <div className="col-span-2 relative flex items-center justify-between mt-4">
                      <Badge variant="default" className="capitalize" style={{ backgroundColor: typeInfo.color }}>
                        {typeInfo.label}
                      </Badge>
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="destructive" className="p-1 h-8 w-8" onClick={() => onRequestDelete(session)}>
                          <Trash2 size={16} />
                        </Button>
                        <Button onClick={() => onEdit(session)} className="p-1 h-8 w-8" variant="ghost">
                          <Edit size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          }}
        />
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

  // --- STABLE HANDLERS ---
  // Must use useCallback so SessionsContent doesn't see "new" functions on every render
  const handleEditClick = useCallback((session: Session) => {
    setEditingSession(session);
    setNewTitle(String(session.title || ''));
    setNewNotes(String(session.notes || '')); // ADDED: Init notes
  }, []);

  const handleSaveEdit = () => {
    if (!editingSession) return;
    // Construct updates object
    const updates: Partial<Session> = {};
    if (newTitle.trim() !== '') updates.title = newTitle;
    // Always update notes if they changed (even to empty)
    if (newNotes !== editingSession.notes) updates.notes = newNotes;

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