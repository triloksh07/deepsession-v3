'use client'; // This component uses hooks, so it must be a Client 
import {
    User as FirebaseUser, // Rename to avoid conflict
} from 'firebase/auth';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { ResponsiveTabTrigger } from '@/components/customUI/ResponsiveTabsTrigger';
import { Dashboard } from '@/components/Dashboard';
import { SessionLog } from '@/components/SessionLog';
import { Analytics } from '@/components/Analytics';
import { Goals } from '@/components/Goals';
import { ExportData } from '@/components/ExportData';
import {
    Home,
    Clock,
    BarChart3,
    Target,
    Download,
    LogOut,
    User as UserIcon,
    Loader2
} from 'lucide-react';

// Hooks & Stores
import { useSessionStore } from '@/store/sessionStore';
import { Session, Goal, User } from '@/types'; // <-- 3. USE THE SHARED TYPES
import { useSessionsQuery } from '@/hooks/useSessionsQuery'; // <-- 1. IMPORT THE NEW HOOK
import { useGoalsQuery } from '@/hooks/useGoalsQuery'; // <-- 2. IMPORT GOALS HOOK-
import {
    useCreateGoal,
    useUpdateGoal,
    useDeleteGoal,
} from '@/hooks/useGoalMutations';
import { handleExport } from '@/lib/exportUtils'; // <-- 1. IMPORT NEW HANDLER

// --- New Helper Component to Manage Views ---
const DashboardContent = ({ user }: { user: FirebaseUser }) => {
    // --- Client-side View State ---
    // const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'session'>('dashboard');
    const startSession = useSessionStore((state) => state.startSession);
    const isSessionActive = useSessionStore((state) => state.isActive);
    // const startSessionMutation = useStartSessionMutation(); // --- ADD ---
    // This state is *only* for showing the form vs. the dashboard
    const [showForm, setShowForm] = useState(false);

    // --- Effect to Sync View with Session State ---

    // This effect syncs the view
    useEffect(() => {
        if (isSessionActive) {
            // If a session is active (from any device), show the tracker
            setShowForm(false);
        }
    }, [isSessionActive]);

    // --- View Handlers ---
    const handleStartSessionClick = () => {
        setShowForm(true); // Just show the form
    };

    // { title: string; type: string; notes: string }
    const handleFormSubmit = (sessionData: Partial<Session>) => {
        startSession(sessionData as Session);
    };

    const handleFormCancel = () => {
        setShowForm(false);
    };

    // --- Default View: The Dashboard Tabs ---
    // This component calls the hook once and distributes data
    return (
        <>
            <DashboardTabs
                onStartSessionClick={handleStartSessionClick}
                userId={user?.uid} // <-- Pass the userId to the next component
            />
        </>
    );
};

// --- UPDATED DashboardContent ---
// It now receives the user object as a prop

// --- New Helper Component for Tabs ---
const DashboardTabs = ({ onStartSessionClick, userId }: { onStartSessionClick: () => void; userId: string; }) => {

    // We'll set the default tab to 'dashboard'
    const [activeTab, setActiveTab] = useState('dashboard');

    // --- Server-side Data ---
    // Call the hook ONCE for all tabs
    const {
        data: sessions,
        isLoading: isLoadingSessions,
        isError: isErrorSessions,
        error: sessionsError // <-- GET THIS
    } = useSessionsQuery(userId,
        // Only fetch if the user is logged in AND one of these tabs is active
        !!userId && (activeTab === 'sessions' || activeTab === 'analytics' || activeTab === 'export'));

    // --- NEW: GOALS DATA ---
    const {
        data: goals,
        isLoading: isLoadingGoals,
        isError: isErrorGoals,
        error: goalsError // <-- GET THIS
    } = useGoalsQuery(userId,
        // Only fetch if the user is logged in AND the goals tab is active
        !!userId && activeTab === 'goals');

    // --- NEW: GOAL MUTATIONS ---
    const createGoalMutation = useCreateGoal();
    const updateGoalMutation = useUpdateGoal();
    const deleteGoalMutation = useDeleteGoal();

    // Combine loading/error states
    const isLoading = isLoadingSessions || isLoadingGoals;
    const isError = isErrorSessions || isErrorGoals;
    const error = sessionsError || goalsError; // Get the first error

    return (
        <Tabs
            defaultValue="dashboard"
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6 grow flex flex-col">

            <TabsList className="grid w-full grid-cols-5">
                {/* --- See how much cleaner this is? --- */}
                <ResponsiveTabTrigger value="dashboard" icon={Home} text="Dashboard" />
                <ResponsiveTabTrigger value="goals" icon={Target} text="Goals" />
                <ResponsiveTabTrigger value="sessions" icon={Clock} text="Sessions" />
                <ResponsiveTabTrigger value="analytics" icon={BarChart3} text="Analytics" />
                <ResponsiveTabTrigger value="export" icon={Download} text="Export" />
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard">

                <Dashboard
                    sessions={sessions || []}
                    onStartSession={onStartSessionClick}
                />
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals">
                <ConnectedDataRenderer isLoading={isLoading} isError={isError} error={error}>
                    <Goals
                        sessions={sessions || []}
                        goals={goals || []}
                        onGoalCreate={(data) => createGoalMutation.mutate(data)}
                        onGoalUpdate={(id, updates) => updateGoalMutation.mutate({ id, updates })}
                        onGoalDelete={(id) => deleteGoalMutation.mutate(id)}
                    />
                </ConnectedDataRenderer>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-medium">Session History</h2>
                    <Button onClick={onStartSessionClick}>
                        <Clock className="mr-2 h-4 w-4" />New Session
                    </Button>
                </div>
                <ConnectedDataRenderer isLoading={isLoading} isError={isError} error={error}>
                    <SessionLog sessions={sessions || []} />
                </ConnectedDataRenderer>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
                <ConnectedDataRenderer isLoading={isLoading} isError={isError} error={error}>
                    <Analytics sessions={sessions || []} />
                </ConnectedDataRenderer>
            </TabsContent>

            {/* Export Tab */}
            {/* Note: You can now pass `goals={goals || []}` to ExportData as well */}
            <TabsContent value="export">
                <ExportData
                    sessions={sessions || []}
                    goals={goals || []}
                    onExport={async (format, options) => {
                        handleExport({
                            format,
                            options,
                            sessions: sessions || [],
                            goals: goals || [],
                        });
                    }} />
            </TabsContent>
        </Tabs>
    );
};

// --- Generic Helper for Loading/Error ---
const ConnectedDataRenderer = ({
    isLoading,
    isError,
    error, // <-- 4. RECEIVE THE ERROR PROP
    children,
}: {
    isLoading: boolean;
    isError: boolean;
    error: Error | null; // <-- 5. ADD THE TYPE
    children: React.ReactNode;
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // --- 6. RENDER THE ACTUAL ERROR ---
    if (isError) {
        // Also log it to the console for good measure
        if (error) console.error("TanStack Query Error:", error);

        return (
            <div className="text-center py-10 text-destructive">
                <p>Error loading data. Please try again.</p>
                {/* This will show us the error message! */}
                {error && (
                    <p className="text-xs mt-2 font-mono">
                        <strong>Debug Info:</strong> {error.message}
                    </p>
                )}
            </div>
        );
    }

    return <>{children}</>;
};

export { DashboardContent };