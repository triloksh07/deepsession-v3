// utils/storage.ts
import { STORAGE_KEYS, StorageKey } from "@/config/storageKeys";

export function setStorageItem(key: StorageKey, value: string) {
  localStorage.setItem(STORAGE_KEYS[key], value);
}

export function removeStorageItem(key: StorageKey) {
  localStorage.removeItem(STORAGE_KEYS[key]);
}

export function getStorageItem(key: StorageKey): string {
  return localStorage.getItem(STORAGE_KEYS[key]) || "";
}
