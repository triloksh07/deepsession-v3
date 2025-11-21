// Simple offline queue utils using idb-keyval
// Save failed POSTs (sessions) to IndexedDB and flush them when online.

import { set, get, del } from 'idb-keyval';

const QUEUE_KEY = 'offline:sessions:queue';

export const pushToOfflineQueue = async (item: unknown) => {
  try {
    const current = (await get(QUEUE_KEY)) || [];
    current.push({ item, ts: Date.now() });
    await set(QUEUE_KEY, current);
    console.log('Saved item to offline queue', item);
  } catch (err) {
    console.error('Failed to save to offline queue', err);
  }
};

export const readOfflineQueue = async () => {
  try {
    return (await get(QUEUE_KEY)) || [];
  } catch (err) {
    console.error('Failed to read offline queue', err);
    return [];
  }
};

export const clearOfflineQueue = async () => {
  try {
    await del(QUEUE_KEY);
    console.log('Cleared offline queue');
  } catch (err) {
    console.error('Failed to clear offline queue', err);
  }
};

// Example flush function (call when online)
export const flushOfflineQueue = async (flushFn: (item: unknown) => Promise<boolean>) => {
  const queue = await readOfflineQueue();
  if (!queue.length) return;
  for (const entry of queue) {
    try {
      const ok = await flushFn(entry.item);
      if (ok) {
        // continue, we'll clear everything at the end
      } else {
        console.warn('FlushFn returned false, keep item in queue', entry);
      }
    } catch (err) {
      console.error('Failed to flush item', err);
      // stop further processing to avoid tight error loops
      return;
    }
  }
  // If we reach here assume all flushed
  await clearOfflineQueue();
};
