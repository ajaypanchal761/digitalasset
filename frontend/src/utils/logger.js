/**
 * Logger utility for development and production
 * Only logs in development mode to avoid console pollution in production
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log info messages (only in development)
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log error messages (always logged, even in production)
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log info messages with prefix (only in development)
   */
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },
};

export default logger;
