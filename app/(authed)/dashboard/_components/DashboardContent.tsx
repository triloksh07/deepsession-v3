'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Target, TrendingUp } from 'lucide-react';
import { Session } from '@/types';
import { calculateDuration } from '@/lib/timeUtils';
import { useSessionStore } from '@/store/sessionStore';
import { useDashboard } from './DashboardProvider';
import ThreadVisualizer from '@/app/(authed)/dashboard/_components/ThreadVisualizer';

export default function DashboardContent() {
    const { sessions: SessionsData } = useDashboard();
    const sessions = SessionsData ?? [];

    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(session => session.date === today);

    const totalFocusTime = todaySessions.reduce((acc, session) => acc + (session.sessionTime / 1000), 0);
    const totalBreakTime = todaySessions.reduce((acc, session) => acc + (session.breakTime / 1000), 0);
    const sessionCount = todaySessions.length;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartString = weekStart.toISOString().split('T')[0];

    const thisWeekSessions = sessions.filter(session => session.date >= weekStartString);
    const weeklySessionTime = thisWeekSessions.reduce((acc, session) => acc + (session.sessionTime / 1000), 0);
    const weeklySessionCount = thisWeekSessions.length;

    // --- FIX: HYBRID TAG AGGREGATION ---
    const typeBreakdown = todaySessions.reduce((acc: { [key: string]: number }, session) => {
        // Fallback to legacy type if tags don't exist yet
        const activity = session.tags?.activity || session.type || 'Other';
        acc[activity] = (acc[activity] || 0) + session.sessionTime;
        return acc;
    }, {});

    const startSession = useSessionStore((state) => state.startSession);

    const handleFormSubmit = () => {
        startSession({} as Session); // Triggers the Pip Tracker
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    // --- FIX: UPDATED COLOR MAP FOR NEW ACTIVITIES ---
    const getTypeColor = (type: string) => {
        const colors: { [key: string]: string } = {
            'Coding': 'bg-purple-100 text-purple-800 border-purple-200',
            'Learning': 'bg-blue-100 text-blue-800 border-blue-200',
            'Writing': 'bg-emerald-100 text-emerald-800 border-emerald-200',
            'Planning': 'bg-amber-100 text-amber-800 border-amber-200',
            'Practice': 'bg-pink-100 text-pink-800 border-pink-200',
            'Other': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[type] || colors['Other'];
    };

    const recentSessions = [...sessions]
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 4); // Boosted to 4 to see more history

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* ... (Keep your 3 summary cards: Today's Sessions, Focus Time, This Week) ... */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today&apos;s Sessions</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sessionCount}</div>
                        <p className="text-xs text-muted-foreground">{sessionCount > 0 ? 'Keep it up!' : 'Start your first session'}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatTime(totalFocusTime)}</div>
                        <p className="text-xs text-muted-foreground">{totalBreakTime > 0 && `+${formatTime(totalBreakTime)} breaks`}</p>
                    </CardContent>
                </Card>

                <Card className='col-span-2 md:col-span-1'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Week</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{weeklySessionCount}</div>
                        <p className="text-xs text-muted-foreground">{formatTime(weeklySessionTime)} total</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Today&apos;s Activity</CardTitle>
                    </CardHeader>
                    <CardContent className={Object.keys(typeBreakdown).length === 0 ? "text-center py-8" : ""}>
                        {Object.keys(typeBreakdown).length === 0 ? (
                            <>
                                <Clock className="mx-auto h-10 w-10 mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground mb-4">No Activity</p>
                            </>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(typeBreakdown)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([type, time]) => (
                                        <div key={type} className="flex items-center space-x-2">
                                            <Badge variant="outline" className={getTypeColor(type)}>{type}</Badge>
                                            <span className="text-sm text-muted-foreground">{calculateDuration(0, time)}</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {recentSessions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentSessions.map((session) => {
                                    const activity = session.tags?.activity || session.type || 'Other';
                                    return (
                                        <div key={`${session.id}-${session.startTime}`} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="font-medium truncate">{session.title}</h4>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatTime(session.sessionTime / 1000)} • {new Date(session.startTime).toLocaleDateString()}
                                                    </p>
                                                    {/* NEW: Render Topic Thread if it exists */}
                                                    {session.tags?.topic && session.tags.topic.length > 0 && (
                                                        <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                            #{session.tags.topic[0]}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={getTypeColor(activity)}>
                                                {activity}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>


            {/* Threads Visualizer */}
            <div className="grid grsid-cols-1 md:gsrid-cols-2 gap-6 mt-6">
                <ThreadVisualizer />
            </div>

            {sessions.length === 0 && (
                <Card>
                    <CardContent className="text-center py-8">
                        <Clock className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                        <h3 className="font-medium mb-2">Ready to start your first session?</h3>
                        <p className="text-muted-foreground mb-4">
                            Track your focus time and build productive habits with DeepSession.
                        </p>
                        <Button onClick={handleFormSubmit}>
                            <Play className="mr-2 h-4 w-4" />
                            Start Your First Session
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}