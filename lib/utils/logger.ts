// lib/logger.ts
const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  info: (...args: unknown[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (!isProduction) {
      console.error(...args);
    } else {
      // TODO: Add external error monitoring here (e.g., Sentry.captureException)
      // Sentry.captureException(args[0]);
    }
  },
  debug: (...args: unknown[]) => {
    if (!isProduction) {
      // specific 'debug' level often hidden by default in browser console
      console.debug(...args);
    }
  },
  // Optional: Keep group support for Dev DX, but disable in Prod
  groupCollapsed: (label: string) => {
    if (!isProduction) console.groupCollapsed(label);
  },
  groupEnd: () => {
    if (!isProduction) console.groupEnd();
  }
};

export default logger;