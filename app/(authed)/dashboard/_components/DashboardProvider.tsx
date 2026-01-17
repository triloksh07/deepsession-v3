// app/(authed)/dashboard/DashboardProvider.tsx
"use client";
import React, { createContext, useContext } from "react";

// import { useSessionsQuery } from "@/hooks/new/SessionQuery";
import { useSessionsQuery } from "@/hooks/new/useSessionsQuery";
// import { useSessionsQuery } from "@/hooks/useSessionsQuery";
import type { UpdateSessionInput } from "@/hooks/new/useSessionMutations";
import { useUpdateSession, useDeleteSession } from "@/hooks/new/useSessionMutations";
import { useGoalsQuery } from "@/hooks/new/useGoalsQuery";
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/new/useGoalMutations";
import type { Session, Goal, } from "@/types";
import { Skeleton as SkeletonBlock } from '@/components/ui/skeleton'

type DashboardContextType = {
  userId: string,
  sessions: Session[] | undefined;
  goals: Goal[] | undefined;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'userId'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // updateSession: (input: UpdateSessionInput) => void;
  // deleteSession: (id: string) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export default function DashboardProvider({
  children,
  userId
}: {
  children: React.ReactNode;
  userId: string;
}) {

  const {
    data: sessionsData,
    isLoading: loadingSessions,
    isError: errSessions,
    error: sessionsError
  } = useSessionsQuery(userId, true);

  // const sessionsData = useSessionsRealtime(userId);

  const {
    data: goalsData,
    isLoading: loadingGoals,
    isError: errGoals,
    error: goalsError
  } = useGoalsQuery(userId, true);

  // --- GOAL MUTATIONS ---
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal(userId);
  const deleteGoalMutation = useDeleteGoal(userId);

  // --- SESSION MUTATIONS (NEW) ---
  // const updateSessionMutation = useUpdateSession(userId);
  // const deleteSessionMutation = useDeleteSession(userId);

  const isLoading = loadingSessions || loadingGoals;
  // const isLoading = false;
  const isError = errSessions || errGoals;
  const error = sessionsError || goalsError; // Get the first error

  const value: DashboardContextType = React.useMemo(() => ({
    userId,
    sessions: sessionsData ?? [],
    goals: goalsData ?? [],
    isLoading,
    error,
    isError: Boolean(isError),
    createGoal: (data) => createGoalMutation.mutate(data),
    updateGoal: (id: string, updates) => updateGoalMutation.mutate({ id, updates }),
    deleteGoal: (id: string) => deleteGoalMutation.mutate(id),
    // ✅ expose session mutations
    // updateSession: (input) => updateSessionMutation.mutate(input),
    // deleteSession: (id) => deleteSessionMutation.mutate(id),
  }), [
    userId, sessionsData, goalsData, loadingSessions, loadingGoals,
    sessionsError, goalsError, errSessions, errGoals
  ]);

  // ✅ OPTIMIZED CHECK:
  // Only block the UI if we are loading AND we have absolutely no data to show.
  // If we have stale/cached data, show that instead of the skeleton.
  const hasNoData = (!sessionsData || sessionsData.length === 0) && (!goalsData || goalsData.length === 0);

  // Note: We use length === 0 check with caution. 
  // If user truly has 0 sessions, we don't want to get stuck in Skeleton.
  // Ideally: if (isLoading && sessionsData === undefined)


  // ❌ REMOVED: The blocking "if (isLoading) return <Skeleton />" block.
  // We want to render children immediately so the Navbar/Sidebar appears instantly.
  // The children (SessionLog, GoalsPage) will handle their own "is data ready?" check.

  // if (isLoading && (sessionsData === undefined || goalsData === undefined)) {
  //   // Skeleton fallback
  //   // TODO: We implement better skeleton later
  //   return (
  //     <div className="p-6 space-y-4">
  //       <SkeletonBlock className={'h-40 w-screen'} />
  //       <SkeletonBlock className={'h-80 w-screen'} />
  //       <SkeletonBlock className={'h-200 w-screen'} />
  //     </div>
  //   );
  // }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
};


/**
 * NOTE:
 * Pages/components consuming this provider should wrap data-dependent sections
 * in <Suspense fallback={...}> to ensure proper loading states.
 * For finer-grained control, consider splitting into separate contexts
 * for sessions and goals, but the unified approach is kept here for simplicity.
 */