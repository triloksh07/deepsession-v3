// config/storageKeys.ts
export const STORAGE_KEYS = {
    ACTIVE_NOTES_DRAFT: "ds-active-notes-draft",
    // add more keys here
  } as const;
  
  // This creates a literal type for each value
  export type StorageKey = keyof typeof STORAGE_KEYS;
  