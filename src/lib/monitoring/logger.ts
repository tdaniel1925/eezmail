'use client';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
      requestId: this.generateRequestId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // TODO: Get from auth context
    return undefined;
  }

  private getCurrentSessionId(): string | undefined {
    // TODO: Get from session storage
    return undefined;
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = this.getConsoleMethod(entry.level);
      consoleMethod(`[${entry.level.toUpperCase()}] ${entry.message}`, entry);
    }

    // TODO: Send to monitoring service in production
    this.sendToMonitoring(entry);
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Implement monitoring service integration
    // Examples:
    // - Send to Sentry for error tracking
    // - Send to LogRocket for session replay
    // - Send to DataDog for metrics
    // - Send to custom analytics service

    if (process.env.NODE_ENV === 'production') {
      // Example: sendToSentry(entry);
      console.log('Would send to monitoring service:', entry);
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.addLog(this.createLogEntry(LogLevel.DEBUG, message, context));
  }

  public info(message: string, context?: Record<string, any>): void {
    this.addLog(this.createLogEntry(LogLevel.INFO, message, context));
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.addLog(this.createLogEntry(LogLevel.WARN, message, context));
  }

  public error(
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context);
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    this.addLog(entry);
  }

  public fatal(
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): void {
    const entry = this.createLogEntry(LogLevel.FATAL, message, context);
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    this.addLog(entry);
  }

  // Performance logging
  public time(label: string): void {
    console.time(label);
  }

  public timeEnd(label: string): number {
    const duration = console.timeEnd(label);
    this.info(`Performance: ${label}`, { duration });
    return duration;
  }

  // API request logging
  public logApiRequest(
    method: string,
    url: string,
    status: number,
    duration: number,
    context?: Record<string, any>
  ): void {
    this.info(`API Request: ${method} ${url}`, {
      method,
      url,
      status,
      duration,
      ...context,
    });
  }

  // User action logging
  public logUserAction(
    action: string,
    component: string,
    context?: Record<string, any>
  ): void {
    this.info(`User Action: ${action}`, {
      action,
      component,
      ...context,
    });
  }

  // Email operation logging
  public logEmailOperation(
    operation: string,
    emailId: string,
    context?: Record<string, any>
  ): void {
    this.info(`Email Operation: ${operation}`, {
      operation,
      emailId,
      ...context,
    });
  }

  // AI operation logging
  public logAIOperation(
    operation: string,
    context?: Record<string, any>
  ): void {
    this.info(`AI Operation: ${operation}`, {
      operation,
      ...context,
    });
  }

  // Get logs for debugging
  public getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  // Clear logs
  public clearLogs(): void {
    this.logs = [];
  }

  // Export logs
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Hook for using logger in React components
export function useLogger() {
  return {
    debug: (message: string, context?: Record<string, any>) =>
      logger.debug(message, context),
    info: (message: string, context?: Record<string, any>) =>
      logger.info(message, context),
    warn: (message: string, context?: Record<string, any>) =>
      logger.warn(message, context),
    error: (message: string, error?: Error, context?: Record<string, any>) =>
      logger.error(message, error, context),
    fatal: (message: string, error?: Error, context?: Record<string, any>) =>
      logger.fatal(message, error, context),
    logUserAction: (
      action: string,
      component: string,
      context?: Record<string, any>
    ) => logger.logUserAction(action, component, context),
    logEmailOperation: (
      operation: string,
      emailId: string,
      context?: Record<string, any>
    ) => logger.logEmailOperation(operation, emailId, context),
    logAIOperation: (operation: string, context?: Record<string, any>) =>
      logger.logAIOperation(operation, context),
    getLogs: (level?: LogLevel, limit?: number) => logger.getLogs(level, limit),
    clearLogs: () => logger.clearLogs(),
    exportLogs: () => logger.exportLogs(),
  };
}
