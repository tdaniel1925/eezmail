'use client';

export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'critical';
  category:
    | 'database'
    | 'auth'
    | 'email'
    | 'ai'
    | 'voice'
    | 'ui'
    | 'api'
    | 'sync';
  message: string;
  stack?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ErrorTrend {
  date: string;
  errorCount: number;
  warningCount: number;
  criticalCount: number;
}

export interface ErrorCategoryStats {
  category: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export class ErrorTracker {
  private errors: ErrorLog[] = [];
  private maxErrors = 1000; // Keep last 1000 errors
  private listeners: ((error: ErrorLog) => void)[] = [];

  constructor() {
    // Load existing errors from localStorage
    this.loadErrors();

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  private loadErrors() {
    try {
      const stored = localStorage.getItem('error-logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.errors = parsed.map((error: any) => ({
          ...error,
          timestamp: new Date(error.timestamp),
          resolvedAt: error.resolvedAt ? new Date(error.resolvedAt) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load error logs:', error);
    }
  }

  private saveErrors() {
    try {
      localStorage.setItem('error-logs', JSON.stringify(this.errors));
    } catch (error) {
      console.error('Failed to save error logs:', error);
    }
  }

  private setupGlobalErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        component: 'Global',
        level: 'error',
        category: 'ui',
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        component: 'Global',
        level: 'error',
        category: 'api',
      });
    });
  }

  logError(errorData: Partial<ErrorLog>): string {
    const error: ErrorLog = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: 'error',
      category: 'ui',
      message: 'Unknown error',
      ...errorData,
    };

    // Add to errors array
    this.errors.unshift(error);

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Save to localStorage
    this.saveErrors();

    // Notify listeners
    this.listeners.forEach((listener) => listener(error));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', error);
    }

    return error.id;
  }

  logWarning(warningData: Partial<ErrorLog>): string {
    return this.logError({ ...warningData, level: 'warning' });
  }

  logInfo(infoData: Partial<ErrorLog>): string {
    return this.logError({ ...infoData, level: 'info' });
  }

  logCritical(criticalData: Partial<ErrorLog>): string {
    return this.logError({ ...criticalData, level: 'critical' });
  }

  getErrors(filters?: {
    level?: string;
    category?: string;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): ErrorLog[] {
    let filtered = [...this.errors];

    if (filters) {
      if (filters.level) {
        filtered = filtered.filter((error) => error.level === filters.level);
      }
      if (filters.category) {
        filtered = filtered.filter(
          (error) => error.category === filters.category
        );
      }
      if (filters.resolved !== undefined) {
        filtered = filtered.filter(
          (error) => error.resolved === filters.resolved
        );
      }
      if (filters.startDate) {
        filtered = filtered.filter(
          (error) => error.timestamp >= filters.startDate!
        );
      }
      if (filters.endDate) {
        filtered = filtered.filter(
          (error) => error.timestamp <= filters.endDate!
        );
      }
      if (filters.limit) {
        filtered = filtered.slice(0, filters.limit);
      }
    }

    return filtered;
  }

  getErrorTrends(days: number = 7): ErrorTrend[] {
    const trends: ErrorTrend[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dayErrors = this.errors.filter(
        (error) => error.timestamp >= startOfDay && error.timestamp <= endOfDay
      );

      trends.push({
        date: date.toISOString().split('T')[0],
        errorCount: dayErrors.filter((e) => e.level === 'error').length,
        warningCount: dayErrors.filter((e) => e.level === 'warning').length,
        criticalCount: dayErrors.filter((e) => e.level === 'critical').length,
      });
    }

    return trends;
  }

  getCategoryStats(): ErrorCategoryStats[] {
    const categoryCounts: Record<string, number> = {};
    const total = this.errors.length;

    this.errors.forEach((error) => {
      categoryCounts[error.category] =
        (categoryCounts[error.category] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      trend: 'stable', // TODO: Calculate actual trend
    }));
  }

  getRecentErrors(limit: number = 10): ErrorLog[] {
    return this.errors.slice(0, limit);
  }

  getUnresolvedErrors(): ErrorLog[] {
    return this.errors.filter((error) => !error.resolved);
  }

  resolveError(errorId: string, resolvedBy?: string): boolean {
    const error = this.errors.find((e) => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date();
      error.resolvedBy = resolvedBy;
      this.saveErrors();
      return true;
    }
    return false;
  }

  clearOldErrors(daysToKeep: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const initialCount = this.errors.length;
    this.errors = this.errors.filter((error) => error.timestamp >= cutoffDate);
    const removedCount = initialCount - this.errors.length;

    this.saveErrors();
    return removedCount;
  }

  exportErrors(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'ID',
        'Timestamp',
        'Level',
        'Category',
        'Message',
        'Component',
        'URL',
        'Resolved',
      ];
      const rows = this.errors.map((error) => [
        error.id,
        error.timestamp.toISOString(),
        error.level,
        error.category,
        error.message.replace(/"/g, '""'),
        error.component || '',
        error.url || '',
        error.resolved ? 'Yes' : 'No',
      ]);

      return [headers, ...rows]
        .map((row) => row.map((field) => `"${field}"`).join(','))
        .join('\n');
    } else {
      return JSON.stringify(this.errors, null, 2);
    }
  }

  subscribe(listener: (error: ErrorLog) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getStats() {
    const total = this.errors.length;
    const unresolved = this.getUnresolvedErrors().length;
    const critical = this.errors.filter((e) => e.level === 'critical').length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayErrors = this.errors.filter((e) => e.timestamp >= today).length;

    return {
      total,
      unresolved,
      critical,
      todayErrors,
      resolved: total - unresolved,
      resolutionRate:
        total > 0 ? Math.round(((total - unresolved) / total) * 100) : 0,
    };
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Helper function for easy error logging
export const logError = (errorData: Partial<ErrorLog>) =>
  errorTracker.logError(errorData);
export const logWarning = (warningData: Partial<ErrorLog>) =>
  errorTracker.logWarning(warningData);
export const logInfo = (infoData: Partial<ErrorLog>) =>
  errorTracker.logInfo(infoData);
export const logCritical = (criticalData: Partial<ErrorLog>) =>
  errorTracker.logCritical(criticalData);


