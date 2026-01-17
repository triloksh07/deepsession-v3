// logger.ts
type LogLevel = "info" | "warn" | "error" | "debug";

interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

function isDevEnv(): boolean {
  return process.env.NODE_ENV === "development";
}

export const devLog: Logger = {
  info: (...args: unknown[]) => {
    if (isDevEnv()) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDevEnv()) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isDevEnv()) console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDevEnv()) console.debug(...args);
  },
};
