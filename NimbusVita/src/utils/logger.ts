/**
 * Production-grade logging system
 * 
 * Features:
 * - Environment-aware logging (DEV vs PROD)
 * - Structured logging with context
 * - Sensitive data sanitization
 * - Error tracking integration points
 * - Performance tracking
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogContext {
  [key: string]: unknown;
}

interface LogMetadata {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

const isDevelopment = __DEV__;
const LOG_LEVEL = isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;

// Sensitive keys to sanitize from logs
const SENSITIVE_KEYS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'session',
  'cookie',
  'ssn',
  'credit_card',
];

/**
 * Sanitizes sensitive data from objects before logging
 */
function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    // Mask tokens and API keys
    if (data.length > 20 && /^[A-Za-z0-9_-]+$/.test(data)) {
      return `${data.substring(0, 4)}...${data.substring(data.length - 4)}`;
    }
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Formats error objects for logging
 */
function formatError(error: unknown): { message: string; stack?: string; name?: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
    };
  }
  
  if (typeof error === 'string') {
    return { message: error };
  }
  
  return { message: String(error) };
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
  if (level < LOG_LEVEL) return;
  
  const metadata: LogMetadata = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context ? sanitizeData(context) as LogContext : undefined,
    error: error ? formatError(error) as Error : undefined,
  };
  
  // In production, send to error tracking service (Sentry, Bugsnag, etc.)
  if (!isDevelopment && level >= LogLevel.ERROR) {
    // Integration point for error tracking services (Sentry, Crashlytics, etc.)
    // Example: Sentry.captureException(error, { level, extra: context });
    // Example: Sentry.captureException(error, { contexts: { custom: metadata } });
  }
  
  // Console output
  const prefix = `[${LogLevel[level]}]`;
  const output = isDevelopment
    ? [prefix, message, context && '\nContext:', context, error && '\nError:', error].filter(Boolean)
    : [prefix, message];
  
  switch (level) {
    case LogLevel.DEBUG:
    case LogLevel.INFO:
      console.log(...output);
      break;
    case LogLevel.WARN:
      console.warn(...output);
      break;
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      console.error(...output);
      break;
  }
}

/**
 * Logger instance with typed methods
 */
export const logger = {
  /**
   * Debug level logging - only visible in development
   * Use for detailed diagnostic information
   */
  debug: (message: string, context?: LogContext): void => {
    log(LogLevel.DEBUG, message, context);
  },
  
  /**
   * Info level logging - general informational messages
   * Use for significant events (user actions, state changes)
   */
  info: (message: string, context?: LogContext): void => {
    log(LogLevel.INFO, message, context);
  },
  
  /**
   * Warning level logging - potentially harmful situations
   * Use for recoverable errors or unexpected states
   */
  warn: (message: string, context?: LogContext, error?: unknown): void => {
    log(LogLevel.WARN, message, context, error);
  },
  
  /**
   * Error level logging - error events
   * Use for errors that should be investigated
   */
  error: (message: string, context?: LogContext, error?: unknown): void => {
    log(LogLevel.ERROR, message, context, error);
  },
  
  /**
   * Fatal level logging - severe error events
   * Use for critical errors that may cause app termination
   */
  fatal: (message: string, context?: LogContext, error?: unknown): void => {
    log(LogLevel.FATAL, message, context, error);
  },
  
  /**
   * Performance timing utility
   * Usage: const timer = logger.time('operation'); ... timer.end();
   */
  time: (label: string) => {
    const startTime = Date.now();
    return {
      end: (context?: LogContext) => {
        const duration = Date.now() - startTime;
        log(LogLevel.DEBUG, `⏱️ ${label}`, { ...context, duration: `${duration}ms` });
      },
    };
  },
};
