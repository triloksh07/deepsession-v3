// app/(authed)/dashboard/analytics/page.tsx
'use client'
import React, { Suspense, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Clock,
  TrendingUp,
  Target,
  Calendar,
  Activity,
  Zap,
  Award
} from 'lucide-react';
import { Session } from '@/types/';
import { useDashboard } from '../_components/DashboardProvider';
import { calculateDuration } from '@/lib/timeUtils'
import { WeeklyAggregate, HeatmapDay, HourlyEntry } from '../_lib/types';

// Lightweight analytics skeleton fallback
function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-6 w-48 rounded bg-muted-foreground/10 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-24 rounded-md bg-muted-foreground/5 animate-pulse" />
        <div className="h-24 rounded-md bg-muted-foreground/5 animate-pulse" />
        <div className="h-24 rounded-md bg-muted-foreground/5 animate-pulse" />
        <div className="h-24 rounded-md bg-muted-foreground/5 animate-pulse" />
      </div>
      <div className="h-64 rounded-md bg-muted-foreground/5 animate-pulse" />
    </div>
  );
}

type AnalyticsContentProps = { timeRange: 'week' | 'month' | 'year' };
// type WeeklyAggregate = {
//   totalSeconds: number;
//   uniqueDates: Set<string>;
// };
// type HeatmapDay = {
//   date: string;
//   sessions: number;
//   totalTime: number;
//   intensity: number;
// };
// type HourlyEntry = {
//   hour: string;
//   sessions: number;
// };

function AnalyticsContent({ timeRange }: AnalyticsContentProps) {
  const { sessions: sessionsData } = useDashboard();
  const sessions = useMemo(() => sessionsData ?? [], [sessionsData]);
  // const sessions = useMemo(() => sessionsData ?? [], [sessionsData]);

  const COLORS = [
    '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#6B7280'
  ];

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // All heavy calculations kept inside the content component
  const {
    filteredSessions,
    totalSessions,
    totalFocusTime,
    averageSessionLength,
    currentStreak,
    typeData,
    dailyChartData,
    hourlyData,
    weeklyData,
    mostProductiveDay,
    heatmapData,
  } = React.useMemo(() => {
    const getDateRange = (range: 'week' | 'month' | 'year') => {
      const now = new Date();
      const end = new Date(now);
      const start = new Date(now);

      switch (range) {
        case 'week': start.setDate(now.getDate() - 7); break;
        case 'month': start.setDate(now.getDate() - 30); break;
        case 'year': start.setDate(now.getDate() - 365); break;
      }

      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    };

    const { start, end } = getDateRange(timeRange);
    const filteredSessions = sessions.filter(session => session.date >= start && session.date <= end);

    const totalSessions = filteredSessions.length;
    const totalFocusTime = filteredSessions.reduce((acc, s) => acc + (s.sessionTime / 1000), 0);
    const averageSessionLength = totalSessions > 0 ? totalFocusTime / totalSessions : 0;

    const today = new Date().toISOString().split('T')[0];
    let currentStreak = 0;
    const sortedDates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    const checkDate = new Date();
    for (const date of sortedDates) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (date === dateStr) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }

    const typeBreakdown = filteredSessions.reduce((acc: Record<string, number>, s) => {
      acc[s.type] = (acc[s.type] || 0) + (s.sessionTime / 1000);
      return acc;
    }, {});

    const typeData = Object.entries(typeBreakdown).map(([type, time]) => ({ name: type, value: Math.round(time / 3600 * 100) / 100, count: filteredSessions.filter(f => f.type === type).length })).sort((a, b) => b.value - a.value);

    const dailyData = filteredSessions.reduce((acc: Record<string, number>, s) => { acc[s.date] = (acc[s.date] || 0) + (s.sessionTime / 1000); return acc; }, {});
    const dailyChartData = Object.entries(dailyData).map(([date, time]) => ({ date, hours: Math.round(time / 3600 * 100) / 100, sessions: filteredSessions.filter(s => s.date === date).length })).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

    const hourlyPattern = filteredSessions.reduce((acc: Record<number, number>, s) => { const hour = new Date(s.startTime).getHours(); acc[hour] = (acc[hour] || 0) + 1; return acc; }, {});
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({ hour: hour.toString().padStart(2, '0') + ':00', sessions: hourlyPattern[hour] || 0 }));

    // const weeklyAggregates = filteredSessions.reduce((acc: any, s) => { const dayIndex = new Date(s.date).getDay(); if (!acc[dayIndex]) acc[dayIndex] = { totalSeconds: 0, uniqueDates: new Set<string>() }; acc[dayIndex].totalSeconds += (s.sessionTime / 1000); acc[dayIndex].uniqueDates.add(s.date); return acc; }, {});
    // console.log("Type of weeklyAggregates from analytics", typeof(weeklyAggregates));

    const weeklyAggregates = filteredSessions.reduce<Record<number, WeeklyAggregate>>((acc, s) => {
      const dayIndex = new Date(s.date).getDay();
      if (!acc[dayIndex]) {
        acc[dayIndex] = { totalSeconds: 0, uniqueDates: new Set<string>() };
      }
      acc[dayIndex].totalSeconds += s.sessionTime / 1000;
      acc[dayIndex].uniqueDates.add(s.date);
      return acc;
    }, {});

    const weeklyData = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, index) => { const aggregate = weeklyAggregates[index]; if (!aggregate) return { day: dayName.slice(0, 3), hours: 0, dayName }; const numActiveDays = aggregate.uniqueDates.size; const averageSeconds = aggregate.totalSeconds / numActiveDays; const averageHours = averageSeconds / 3600; return { day: dayName.slice(0, 3), dayName, hours: Math.round(averageHours * 100) / 100 }; });
    const mostProductiveDay = weeklyData.reduce((max, d) => d.hours > max.hours ? d : max, weeklyData[0] || { day: '', dayName: '', hours: 0 });

    // changed days: any[] to const days: HeatmapDay[] = [];

    const getLast90Days = () => { const days: HeatmapDay[] = []; const today = new Date(); for (let i = 89; i >= 0; i--) { const date = new Date(today); date.setDate(today.getDate() - i); const dateStr = date.toISOString().split('T')[0]; const dayData = filteredSessions.filter(s => s.date === dateStr); const totalTime = dayData.reduce((acc, s) => acc + (s.sessionTime / 1000), 0); days.push({ date: dateStr, sessions: dayData.length, totalTime, intensity: totalTime > 0 ? Math.min(Math.ceil(totalTime / 3600), 4) : 0 }); } return days; };
    const heatmapData = getLast90Days();

    return { filteredSessions, totalSessions, totalFocusTime, averageSessionLength, currentStreak, typeData, dailyChartData, hourlyData, weeklyData, mostProductiveDay, heatmapData };
  }, [sessions, timeRange]);


  const peakHour = hourlyData.reduce((max: HourlyEntry, hour: HourlyEntry) =>
    hour.sessions > max.sessions ? hour : max
  );

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <h3 className="font-medium mb-2">No Analytics Data Yet</h3>
        <p>Complete some sessions to see your productivity insights here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(totalFocusTime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(averageSessionLength)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak}</div>
            <p className="text-xs text-muted-foreground">{currentStreak === 1 ? 'day' : 'days'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts (kept same structure as before) */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} formatter={(value, name) => [name === 'hours' ? `${value}h` : value, name === 'hours' ? 'Focus Time' : 'Sessions']} />
                <Line type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={2} dataKey="value">
                  {typeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}h`, 'Focus Time']} />
                <Legend formatter={(value, entry) => { const payload = (entry.payload as unknown) as { count?: number }; return (<span style={{ color: entry.color }}>{value} ({payload?.count ?? ''} sessions)</span>); }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => [`${value}h`, 'Focus Time']} />
                <Bar dataKey="hours" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="hour" fontSize={12} interval={2} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => [`${value}`, 'Sessions Started']} />
                <Bar dataKey="sessions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Calendar className="h-5 w-5" /><span>Activity Heatmap (Last 90 Days)</span></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-13 gap-1 mb-4">
            {heatmapData.map((day: any) => (
              <div key={day.date} className={`${day.intensity === 0 ? 'bg-gray-100' : day.intensity === 1 ? 'bg-green-200' : day.intensity === 2 ? 'bg-green-300' : day.intensity === 3 ? 'bg-green-400' : 'bg-green-500'} w-3 h-3 rounded-sm`} title={`${day.date}: ${day.sessions} sessions, ${formatTime(day.totalTime)}`} />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Award className="h-5 w-5" /><span>Productivity Insights</span></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyData.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium">Most Productive Day</h4>
                  <p className="text-sm text-muted-foreground">{mostProductiveDay.dayName} with a {mostProductiveDay.hours.toFixed(1)}h average</p>
                </div>
                <Badge variant="secondary">{mostProductiveDay.day}</Badge>
              </div>
            )}

            {typeData.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium">Top Focus Area</h4>
                  <p className="text-sm text-muted-foreground">{typeData[0].name} sessions account for {Math.round((typeData[0].value / typeData.reduce((sum, item) => sum + item.value, 0)) * 100)}% of your focus time</p>
                </div>
                <Badge variant="secondary">{typeData[0].name}</Badge>
              </div>
            )}

            {hourlyData.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium">Peak Start Time</h4>
                  <p className="text-sm text-muted-foreground">Most sessions start around
                    {/*hourlyData.reduce((max: any, hour: any) => hour.sessions > max.sessions ? hour : max).hour*/}
                    {`${peakHour}`}
                  </p>
                </div>
                <Badge variant="secondary">
                  {`${peakHour}`}
                  {/* {hourlyData.reduce((max: any, hour: any) => hour.sessions > max.sessions ? hour : max).hour} */}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  return (
    <div className="space-y-6">
      {/* SSR shell header + selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Analytics & Insights</h2>
        <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'year') => setTimeRange(value)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suspense boundary keyed by timeRange so changing selector remounts and shows fallback */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent key={timeRange} timeRange={timeRange} />
      </Suspense>
    </div>
  );
}
