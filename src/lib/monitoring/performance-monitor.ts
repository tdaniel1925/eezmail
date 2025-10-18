'use client';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  context?: Record<string, any>;
}

export interface PerformanceThreshold {
  name: string;
  warning: number;
  critical: number;
  unit: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThreshold[] = [];
  private maxMetrics = 1000;

  private constructor() {
    this.initializeThresholds();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeThresholds(): void {
    this.thresholds = [
      {
        name: 'page_load_time',
        warning: 2000,
        critical: 5000,
        unit: 'ms',
      },
      {
        name: 'api_response_time',
        warning: 1000,
        critical: 3000,
        unit: 'ms',
      },
      {
        name: 'database_query_time',
        warning: 500,
        critical: 1000,
        unit: 'ms',
      },
      {
        name: 'memory_usage',
        warning: 100,
        critical: 200,
        unit: 'MB',
      },
      {
        name: 'email_sync_time',
        warning: 10000,
        critical: 30000,
        unit: 'ms',
      },
      {
        name: 'ai_processing_time',
        warning: 5000,
        critical: 15000,
        unit: 'ms',
      },
    ];
  }

  public recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    context?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context,
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check thresholds
    this.checkThresholds(metric);
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.find((t) => t.name === metric.name);
    if (!threshold) return;

    if (metric.value >= threshold.critical) {
      console.error(`CRITICAL: ${metric.name} exceeded threshold`, {
        value: metric.value,
        threshold: threshold.critical,
        unit: threshold.unit,
      });
      // TODO: Send alert to monitoring service
    } else if (metric.value >= threshold.warning) {
      console.warn(`WARNING: ${metric.name} approaching threshold`, {
        value: metric.value,
        threshold: threshold.warning,
        unit: threshold.unit,
      });
    }
  }

  // Page load performance
  public measurePageLoad(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.recordMetric(
          'page_load_time',
          navigation.loadEventEnd - navigation.loadEventStart
        );
      }
    });
  }

  // API request performance
  public measureApiRequest(
    method: string,
    url: string,
    startTime: number,
    endTime: number,
    status: number
  ): void {
    const duration = endTime - startTime;
    this.recordMetric('api_response_time', duration, 'ms', {
      method,
      url,
      status,
    });
  }

  // Database query performance
  public measureDatabaseQuery(
    query: string,
    startTime: number,
    endTime: number,
    rowCount?: number
  ): void {
    const duration = endTime - startTime;
    this.recordMetric('database_query_time', duration, 'ms', {
      query: query.substring(0, 100), // Truncate for privacy
      rowCount,
    });
  }

  // Memory usage monitoring
  public measureMemoryUsage(): void {
    if (typeof window === 'undefined') return;

    const memory = (performance as any).memory;
    if (memory) {
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      this.recordMetric('memory_usage', usedMB, 'MB');
    }
  }

  // Email sync performance
  public measureEmailSync(
    accountId: string,
    startTime: number,
    endTime: number,
    emailCount: number
  ): void {
    const duration = endTime - startTime;
    this.recordMetric('email_sync_time', duration, 'ms', {
      accountId,
      emailCount,
    });
  }

  // AI processing performance
  public measureAIProcessing(
    operation: string,
    startTime: number,
    endTime: number,
    context?: Record<string, any>
  ): void {
    const duration = endTime - startTime;
    this.recordMetric('ai_processing_time', duration, 'ms', {
      operation,
      ...context,
    });
  }

  // Component render performance
  public measureComponentRender(
    componentName: string,
    startTime: number,
    endTime: number
  ): void {
    const duration = endTime - startTime;
    this.recordMetric('component_render_time', duration, 'ms', {
      component: componentName,
    });
  }

  // Get performance metrics
  public getMetrics(
    name?: string,
    timeRange?: { start: Date; end: Date },
    limit?: number
  ): PerformanceMetric[] {
    let filteredMetrics = this.metrics;

    if (name) {
      filteredMetrics = filteredMetrics.filter((m) => m.name === name);
    }

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter((m) => {
        const timestamp = new Date(m.timestamp);
        return timestamp >= timeRange.start && timestamp <= timeRange.end;
      });
    }

    if (limit) {
      filteredMetrics = filteredMetrics.slice(-limit);
    }

    return filteredMetrics;
  }

  // Get performance summary
  public getPerformanceSummary(): Record<
    string,
    {
      count: number;
      average: number;
      min: number;
      max: number;
      recent: PerformanceMetric[];
    }
  > {
    const summary: Record<string, any> = {};

    this.metrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          total: 0,
          min: Infinity,
          max: -Infinity,
          recent: [],
        };
      }

      const stats = summary[metric.name];
      stats.count++;
      stats.total += metric.value;
      stats.min = Math.min(stats.min, metric.value);
      stats.max = Math.max(stats.max, metric.value);
      stats.recent.push(metric);

      // Keep only last 10 recent metrics
      if (stats.recent.length > 10) {
        stats.recent = stats.recent.slice(-10);
      }
    });

    // Calculate averages
    Object.keys(summary).forEach((name) => {
      const stats = summary[name];
      stats.average = stats.total / stats.count;
      delete stats.total; // Remove total from final result
    });

    return summary;
  }

  // Clear metrics
  public clearMetrics(): void {
    this.metrics = [];
  }

  // Export metrics
  public exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  // Start monitoring
  public startMonitoring(): void {
    this.measurePageLoad();

    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.measureMemoryUsage();
    }, 30000);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook for using performance monitor in React components
export function usePerformanceMonitor() {
  return {
    recordMetric: (
      name: string,
      value: number,
      unit?: string,
      context?: Record<string, any>
    ) => performanceMonitor.recordMetric(name, value, unit, context),
    measureApiRequest: (
      method: string,
      url: string,
      startTime: number,
      endTime: number,
      status: number
    ) =>
      performanceMonitor.measureApiRequest(
        method,
        url,
        startTime,
        endTime,
        status
      ),
    measureDatabaseQuery: (
      query: string,
      startTime: number,
      endTime: number,
      rowCount?: number
    ) =>
      performanceMonitor.measureDatabaseQuery(
        query,
        startTime,
        endTime,
        rowCount
      ),
    measureEmailSync: (
      accountId: string,
      startTime: number,
      endTime: number,
      emailCount: number
    ) =>
      performanceMonitor.measureEmailSync(
        accountId,
        startTime,
        endTime,
        emailCount
      ),
    measureAIProcessing: (
      operation: string,
      startTime: number,
      endTime: number,
      context?: Record<string, any>
    ) =>
      performanceMonitor.measureAIProcessing(
        operation,
        startTime,
        endTime,
        context
      ),
    measureComponentRender: (
      componentName: string,
      startTime: number,
      endTime: number
    ) =>
      performanceMonitor.measureComponentRender(
        componentName,
        startTime,
        endTime
      ),
    getMetrics: (
      name?: string,
      timeRange?: { start: Date; end: Date },
      limit?: number
    ) => performanceMonitor.getMetrics(name, timeRange, limit),
    getPerformanceSummary: () => performanceMonitor.getPerformanceSummary(),
    clearMetrics: () => performanceMonitor.clearMetrics(),
    exportMetrics: () => performanceMonitor.exportMetrics(),
  };
}
