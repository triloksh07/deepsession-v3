// This is the data structure our app will use
// Based on components/SessionLog.tsx
export interface Session {
  id: number; // The numeric ID we just added
  title: string;
  type: string;
  notes: string;
  sessionTime: number;
  breakTime: number;
  startTime: number; // This is a timestamp
  endTime: number; // This is a timestamp
  date: string;
}

export interface Goal {
  id: string; // Firestore document ID
  userId: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  targetValue: number;
  targetUnit: 'hours' | 'sessions' | 'minutes';
  category: string; // e.g., 'Coding', 'Learning', or 'All'
  isActive: boolean;
  createdAt: string; // ISO string
}