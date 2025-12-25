'use client';

import React, { Suspense, useState, useCallback, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, FileText, Edit, Trash2 } from 'lucide-react';
import type { Session } from '@/types';
import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config';
import { useUpdateSession, useDeleteSession } from '@/hooks/new/useSessionMutations';
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
// This prevents re-rendering the entire Markdown list when the parent state (Edit Dialog) changes.
const SessionsContent = memo(
  function SessionsContent({
    onEdit,
    onRequestDelete }:
    {
      onEdit: (s: Session) => void;
      onRequestDelete: (s: Session) => void;
    }) {
    const { sessions } = useDashboard();
    const sessionList = useMemo(()=>{
      return sessions ?? [];
    }, [sessions]);

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

    // Re-calculate these only when sessionList changes, not when parent re-renders
    const groupedSessions = React.useMemo(() => {
      return sessionList.reduce((groups: Record<string, Session[]>, session) => {
        const date = session.date;
        if (!groups[date]) groups[date] = [];
        groups[date].push(session);
        return groups;
      }, {});
    }, [sessionList]);

    const sortedDates = Object.keys(groupedSessions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (sessionList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No sessions yet. Start your first session to begin tracking!</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date} className="space-y-3">
            <div className="flex items-center space-x-2 text-muted-foreground border-b pb-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(date)}</span>
              <span className="text-xs">({groupedSessions[date].length} session{groupedSessions[date].length !== 1 ? 's' : ''})</span>
            </div>

            <div className="space-y-3">
              {groupedSessions[date]
                .sort((a, b) => b.startTime - a.startTime)
                .map((session) => {
                  const typeInfo = getSessionTypeInfo(session.type);
                  return (
                    <Card key={`${session.id}-${session.startTime}`} className="transition-shadow hover:shadow-md">
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
                          <Badge variant="default" className="capitalize">
                            {typeInfo.label}
                          </Badge>
                          <div className="flex items-center justify-center space-x-2">
                            <Button variant="destructive" className="p-1" onClick={() => onRequestDelete(session)}>
                              <Trash2 size={16} />
                            </Button>
                            <Button onClick={() => onEdit(session)} className="p-1" variant="ghost">
                              <Edit size={16} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}
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

      <Suspense fallback={<SessionsListSkeleton />}>
        <SessionsContent onEdit={handleEditClick} onRequestDelete={handleRequestDelete} />
      </Suspense>

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
            <Button onClick={handleSaveEdit} disabled={isUpdating}>Save changes</Button>
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