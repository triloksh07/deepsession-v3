'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDashboard } from './DashboardProvider';
import { Target, Clock, Activity } from 'lucide-react';

// Helper to format ms to "12h 30m"
// 1. FIX THE 0m BUG
const formatDuration = (ms: number) => {
  if (ms > 0 && ms < 60000) return '<1m'; // Catch ultra-short tests
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function ThreadVisualizer() {
  const { sessions } = useDashboard();

  // The "Architect's" Aggregation Engine

  const threadData = useMemo(() => {
    if (!sessions) return [];
    const stats: Record<string, { totalTime: number; sessionCount: number; activities: Record<string, number> }> = {};

    sessions.forEach(session => {
      // Check if topic is a string (legacy mistake) or array
      let rawTopics = session.tags?.topic || [];
      if (typeof rawTopics === 'string') rawTopics = [rawTopics];

      const topics = rawTopics.length > 0 ? rawTopics : ['Miscellaneous'];

      // 2. FIX THE CASE SENSITIVITY BUG (Normalize 'coding' to 'Coding')
      const rawActivity = session.tags?.activity || 'Other';
      const activity = rawActivity.charAt(0).toUpperCase() + rawActivity.slice(1).toLowerCase();

      const time = session.sessionTime || 0;

      topics.forEach(topic => {
        // Normalize Topic spacing just in case
        const cleanTopic = topic.trim();

        if (!stats[cleanTopic]) {
          stats[cleanTopic] = { totalTime: 0, sessionCount: 0, activities: {} };
        }

        stats[cleanTopic].totalTime += time;
        stats[cleanTopic].sessionCount += 1;

        if (!stats[cleanTopic].activities[activity]) {
          stats[cleanTopic].activities[activity] = 0;
        }
        stats[cleanTopic].activities[activity] += time;
      });
    });

    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalTime - a.totalTime);

  }, [sessions]);

  if (!sessions || sessions.length === 0) return null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Target className="w-5 h-5 text-[#8A2BE2]" />
          <span>Active Learning Threads</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {threadData.map((thread) => (
          <div key={thread.name} className="space-y-2 border-b border-border/50 pb-4 last:border-0 last:pb-0">

            {/* Thread Header */}
            <div className="flex justify-between items-end">
              <div>
                <h4 className="font-semibold text-base">{thread.name}</h4>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {thread.sessionCount} sessions
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-medium">{formatDuration(thread.totalTime)}</span>
              </div>
            </div>

            {/* Activity Breakdown (The "How" you spent the time) */}
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(thread.activities)
                .sort(([, timeA], [, timeB]) => timeB - timeA)
                .map(([actName, actTime]) => {
                  const percentage = Math.round((actTime / thread.totalTime) * 100);
                  // Don't show micro-activities under 5% to keep UI clean
                  if (percentage < 5) return null;

                  return (
                    <Badge key={actName} variant="secondary" className="bg-muted text-xs font-normal border border-border/50">
                      <Activity className="w-3 h-3 mr-1 opacity-50" />
                      {actName} ({percentage}%)
                    </Badge>
                  );
                })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}