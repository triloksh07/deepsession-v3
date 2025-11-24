
---

# 1. Product Summary

**DeepSession** =
*A personal deep-work & progress tracking system for self-learners, students, developers and creators.*

Core philosophy: **Track → Analyse → Improve**

User can:

* Start focus sessions (with breaks)
* Add tasks and goals
* Take notes linked to sessions/goals
* Tag everything
* See analytics and streaks
* Get AI insights & suggestions
* Use it offline → sync later

---

# 2. Main Personas

1. **Self-learner / Developer**

   * Tracks coding / learning sessions
   * Wants daily & weekly progress
   * Needs notes for what they learned

2. **Student (college/competitive)**

   * Studies multiple subjects
   * Wants subject-wise time and streak
   * Needs exam goals

3. **Creator / Solopreneur**

   * Has multiple projects
   * Tracks deep work per project
   * Uses tags & notes heavily

---

# 3. Core Modules & Features

## 3.1 Auth & User Profile

* Email/password or OAuth login
* Basic profile:

  * `name`, `email`, `avatar`, `timezone`
* App preferences:

  * theme (light/dark)
  * default session length
  * default break length
  * AI features on/off

---

## 3.2 Session Engine (Heart of DeepSession)

**Goal:** Minimal friction, accurate tracking, offline-first.

Features:

1. **Quick Start**

   * One main button: `Start Session`
   * Optional modal:

     * Title
     * Category (session type)
     * Tags
     * Optional goal link
     * Initial note

2. **Timer Logic**

   * Start / Pause / Resume / End
   * Track:

     * `focus_time`
     * `break_time`
     * `started_at`, `ended_at`
   * Support multiple short breaks per session

3. **Breaks**

   * Button: `Start Break`
   * Resume returns to focus
   * Each break logged with:

     * `start`, `end`
     * `reason` (optional)

4. **Floating Timer (PiP)**

   * Small always-on-top window
   * Shows current focus timer + break indicator
   * Controls: End, Break, Expand
   * Continues running even if user switches tab/app

5. **Session Completion**

   * On end:

     * show summary
     * user can edit title, tags, notes
     * optional AI summary: “What did I do this session?”

---

## 3.3 Tasks / Today’s Work

**Right panel on dashboard = Today’s Tasks**

Features:

* Add task (title + optional description)
* Set priority: `low | medium | high`
* Set tags
* Optional link to goal
* Optional estimated time
* Check/uncheck complete
* Reorder tasks
* Filter: `All | Today | Completed`

Bonus (later):

* AI: “Suggest today’s tasks based on goals & past sessions”

---

## 3.4 Goals

**Higher-level outcomes the user wants.**

Features:

* Create goal:

  * title
  * description
  * category (e.g. coding, fitness)
  * optional target hours
  * timeframe: `daily | weekly | monthly | custom`
  * due date
* Track progress:

  * sessions linked to that goal
  * total focus time vs target
  * completion percentage
* Status: `active | paused | completed`

Later (AI):

* Auto breakdown big goal → smaller sub-goals / tasks
* Suggestions like:

  * “You’re behind this week on Goal X”

---

## 3.5 Notes System (Unified)

Notes appear **everywhere** but data model is **one unified Note**.

Use-cases:

* Session-specific notes (“Today I worked on React hooks.”)
* Goal-specific notes (“Plan for next week’s DSA schedule.”)
* Free-form general notes / journal (“What I learned today”)

Features:

* Rich text or simple markdown
* Tags
* Linking:

  * `linked_session_id?`
  * `linked_goal_id?`
  * or `null` for general notes
* Notes list view:

  * filter by tags
  * filter by linked type (session/goal/general)
  * search

Later (AI):

* Summarise notes
* Group by topic
* Generate “weekly learning recap”

---

## 3.6 Tags System

Tags are **user-defined labels**.

Use-cases:

* Project names: `#portfolio`, `#clientA`
* Topics: `#react`, `#ds`, `#math`
* Contexts: `#deep-work`, `#light-work`

Applies to:

* Sessions
* Tasks
* Goals
* Notes

Features:

* Create tag on the fly (`#` input style or chips)
* Colors (optional)
* Popular tags suggestions
* Tag-based filters in:

  * Sessions list
  * Analytics
  * Notes

---

## 3.7 Analytics & Insights

Main Analytics page includes:

1. **Time Range Selector**

   * Last 7 days / 30 days / 90 days / Custom

2. **Key Stats**

   * Total focus time
   * Avg session length
   * Number of sessions
   * Current streak

3. **Charts**

   * Daily focus time (line chart)
   * Weekly pattern (bar: day vs avg hours)
   * Hourly pattern (bar: hour vs session count)
   * Category breakdown (pie)
   * Tag breakdown (top tags)
   * Heatmap (last 90 days)

4. **Insights**

   * Most productive day
   * Most common category
   * Top tags by time
   * Peak focus time window
   * Streak insights

5. **AI Insights (MVP)**

   * “This week you focused more on X”
   * “Compared to last week, your average focus increased/decreased”
   * “Best time for deep work seems to be Y–Z”

---

## 3.8 AI Assistant

DeepSession has an AI layer that:

### Inputs:

* Sessions (title, duration, category, tags, notes)
* Goals
* Tasks
* Notes
* Analytics data (aggregated stats)

### Capabilities:

1. **Session Summary**

   * Summarise notes + title + category into 2–3 bullet points.

2. **Daily Recap**

   * “What did I do today?”

3. **Weekly Summary**

   * “How was my week?”
   * Show ups & downs, highlight improvements

4. **Goal Assist**

   * Break big goal into small steps
   * Suggest number of sessions needed

5. **Task Suggestions**

   * Based on goals & previous sessions:

     * “Today you should work on X”

6. **Tag Suggestions**

   * Suggest additional tags based on notes & title

---

## 3.9 Offline-First & Sync

* Uses Firestore offline persistence
* All writes:

  * Save locally first
  * Sync when online
* Reads:

  * Prefer cache → then background update
* UI:

  * Shows when data is from cache vs server
  * No blocking spinners; always show last known state

---

## 3.10 Export & Backup

* Export:

  * Sessions CSV
  * Notes TXT/Markdown
  * Goals + progress JSON/CSV
* Later:

  * Scheduled weekly report PDF via email

---

# 4. Data Model (Entity Specification)

### 4.1 User

```ts
User {
  id: string;          // auth uid
  email: string;
  name?: string;
  avatarUrl?: string;
  timezone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultSessionType?: string;
    defaultSessionLengthMin?: number;
    defaultBreakLengthMin?: number;
    aiEnabled: boolean;
  };
}
```

---

### 4.2 Session

```ts
Session {
  id: string;                // Firestore doc id
  userId: string;

  title: string;
  type: string;              // category id or name
  tags: string[];            // tag IDs or names

  notes?: string;            // quick notes (small)
  linkedGoalId?: string;

  started_at: string;        // ISO
  ended_at: string;          // ISO

  total_focus_ms: number;
  total_break_ms: number;

  breaks: {
    start: string;           // ISO
    end: string;             // ISO
    reason?: string;
  }[];

  created_at: Timestamp;
  updated_at: Timestamp;
}
```

*UI model version (after adapt):*

```ts
UISession {
  id: string;
  title: string;
  type: string;
  tags: string[];
  notes?: string;
  sessionTime: number;   // ms
  breakTime: number;     // ms
  startTime: number;     // epoch ms
  endTime: number;       // epoch ms
  date: string;          // YYYY-MM-DD
  linkedGoalId?: string;
}
```

---

### 4.3 Task

```ts
Task {
  id: string;
  userId: string;

  title: string;
  description?: string;

  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';

  tags: string[];
  linkedGoalId?: string;
  linkedSessionId?: string;

  due_date?: string;         // ISO date
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 4.4 Goal

```ts
Goal {
  id: string;
  userId: string;

  title: string;
  description?: string;

  category: string;          // e.g. 'coding', 'learning'
  tags: string[];

  target_hours?: number;     // optional numeric target
  timeframe: 'daily' | 'weekly' | 'monthly' | 'custom';
  start_date?: string;       // ISO YYYY-MM-DD
  end_date?: string;

  status: 'active' | 'paused' | 'completed';

  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 4.5 Note

```ts
Note {
  id: string;
  userId: string;

  content: string;           // markdown or plain text
  tags: string[];

  type: 'session' | 'goal' | 'general';
  linkedSessionId?: string;
  linkedGoalId?: string;

  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 4.6 Tag

```ts
Tag {
  id: string;
  userId: string;

  name: string;              // '#react'
  color?: string;            // hex
  created_at: Timestamp;
}
```

*(You can also avoid a separate Tag collection and treat tags as free-form strings; but a collection helps with color, suggestions, etc.)*

---

# 5. API / Service Layer (Abstract)

Assuming some backend / functions or AI-agent tools, define these logical operations:

### Sessions

* `createSession(payload: SessionCreateInput): Session`
* `updateSession(id: string, updates: SessionUpdateInput): Session`
* `deleteSession(id: string): void`
* `listSessions(userId, filters): Session[]`

### Tasks

* `createTask`
* `updateTask`
* `deleteTask`
* `listTasks(userId, filters)`

### Goals

* `createGoal`
* `updateGoal`
* `deleteGoal`
* `listGoals(userId, filters)`

### Notes

* `createNote`
* `updateNote`
* `deleteNote`
* `listNotes(userId, filters)`

### Analytics

* `getSummary(userId, timeRange)`
* `getDailySeries(userId, timeRange)`
* `getWeeklyPattern(userId, timeRange)`
* `getHourlyPattern(userId, timeRange)`
* `getCategoryBreakdown(userId, timeRange)`
* `getTagBreakdown(userId, timeRange)`
* `getHeatmap(userId, lastNDays)`

### AI

* `aiGenerateSessionSummary(sessionId)`
* `aiGenerateDailyRecap(date)`
* `aiGenerateWeeklyReport(weekRange)`
* `aiSuggestTasksForToday()`
* `aiBreakGoalIntoSteps(goalId)`
* `aiSuggestTagsForSession(sessionId)`
* `aiExplainProgress(userId, timeRange)`

---

# 6. Event Model (for AI / Automations)

Useful events that AI or automations can subscribe to:

* `session_started`
* `session_ended`
* `session_updated`
* `task_created`
* `task_completed`
* `goal_created`
* `goal_completed`
* `note_created`
* `daily_rollover` (end-of-day)
* `weekly_rollover`

Example use:

* On `session_ended` → generate optional AI summary.
* On `daily_rollover` → generate daily recap.
* On `weekly_rollover` → generate weekly report.

---

# 7. Non-Functional Requirements

* **Offline-first:**
  reads from cache first, Firestore persistence for writes.

* **Performance:**
  Dashboard loads quickly; heavy analytics behind Suspense with skeletons.

* **Modularity:**
  Each module (sessions, goals, tasks, notes, analytics, AI) separated cleanly.

* **Privacy:**
  User data is private; AI gets only necessary context.

* **Extensibility:**
  Future: integrations (GitHub, LeetCode, etc.) can plug into sessions & analytics.

---

# 8. How an AI Should Think About DeepSession

If you give this spec to an AI (LLM / agent), it should:

1. Treat **sessions** as the main timeline of user’s work.
2. Use **goals** to define direction.
3. Use **tasks** to define immediate actions.
4. Use **notes** to capture meaning + context.
5. Use **tags** to connect everything semantically.
6. Use **analytics** to observe patterns.
7. Use **AI tools** to:

   * summarise
   * recommend
   * plan
   * reflect

---
