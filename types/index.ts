
// export type ActivityType = "Coding" | "Learning" | "Writing" | "Planning" | "Practice" | "Debugging" | "Other" | "";
// export type SourceType = "Cohort" | 'Independent Work' | "Self-Study" | "Personal Project" | "Freelance" | "Other" | "";

// export interface SessionTags {
//   topic: string[];
//   activity: ActivityType;
//   source: SourceType;
// }
export interface SessionTags {
  topic: string[];
  activity: string;
  source: string;
}

export interface Session {
  id: string;
  title: string;
  type?: string;
  tags: SessionTags;
  notes: string;
  sessionTime: number;
  breakTime: number;
  startTime: number;
  endTime: number;
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
  updatedAt?: string; // ISO string (optional)
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface SessionFormProps {
  onSubmit: (sessionData: Partial<Session>) => void;
  // onCancel: () => void;
}