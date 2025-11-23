// lib/logging.ts
export function logSessionsFetch(opts: {
  source: 'fetch' | 'snapshot';
  userId: string;
  count: number;
  fromCacheCount?: number;
  fromServerCount?: number;
  fromCacheSnapshot?: boolean;
}) {
  const {
    source,
    userId,
    count,
    fromCacheCount,
    fromServerCount,
    fromCacheSnapshot,
  } = opts;

  const online = typeof navigator !== 'undefined' ? navigator.onLine : 'unknown';
  const ts = new Date().toISOString();

  console.groupCollapsed(
    `[sessions:${source}] user=${userId} count=${count} online=${online} @ ${ts}`
  );
  if (fromCacheCount != null || fromServerCount != null) {
    console.log('docs from cache:', fromCacheCount);
    console.log('docs from server:', fromServerCount);
  }
  if (fromCacheSnapshot != null) {
    console.log('snapshot.metadata.fromCache:', fromCacheSnapshot);
  }
  console.groupEnd();
}
