/**
 * Metrics Constants
 * Common metrics that can be tracked
 * This file has no server dependencies and can be imported by client components
 */

export const METRICS = {
  // Performance
  API_LATENCY: 'api_latency_ms',
  DB_QUERY_TIME: 'db_query_time_ms',

  // Errors
  ERROR_RATE: 'error_rate',
  HTTP_4XX: 'http_4xx_count',
  HTTP_5XX: 'http_5xx_count',

  // Email Sync
  SYNC_DURATION: 'sync_duration_seconds',
  EMAILS_PROCESSED: 'emails_processed_count',
  SYNC_ERRORS: 'sync_error_count',

  // System Resources
  CPU_USAGE: 'cpu_usage_percent',
  MEMORY_USAGE: 'memory_usage_percent',
  DISK_USAGE: 'disk_usage_percent',

  // Business Metrics
  ACTIVE_USERS: 'active_users_count',
  NEW_SIGNUPS: 'new_signups_count',
  REVENUE: 'revenue_usd',
} as const;

export type MetricType = (typeof METRICS)[keyof typeof METRICS];

