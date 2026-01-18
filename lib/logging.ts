// lib/logging.ts
import logger from '@/lib/utils/logger';

export function logSessionsFetch(opts: {
  source: 'fetch' | 'snapshot' | 'snapshot_update';
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

  // This entire block will now be stripped in Production
  logger.groupCollapsed(
    `[sessions:${source}] user=${userId} count=${count} online=${online} @ ${ts}`
  );

  if (fromCacheCount != null || fromServerCount != null) {
    logger.debug('docs from cache:', fromCacheCount);
    logger.debug('docs from server:', fromServerCount);
  }
  if (fromCacheSnapshot != null) {
    logger.debug('snapshot.metadata.fromCache:', fromCacheSnapshot);
  }
  logger.groupEnd();
}
