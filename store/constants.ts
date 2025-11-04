
// ----------------- app/store/constants.ts -----------------
export const STORAGE_KEYS = {
    SESSIONS: 'focusflow-v2-storage',
  };
  
  export const DEFAULT_SESSION_STATE = {
    recentSessions: [],
    customSessionTypes: [],
    selectedSessionType: "",
    currentSessionDetails: {
      title: '',
      notes: '',
      sessionTypeId: null,
    },
    // Active session state defaults
    sessionActive: false,
    onBreak: false,
    sessionStartTime: null,
    breaks: [],
  };
  