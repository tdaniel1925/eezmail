/**
 * Sync Error Handling & Retry Strategy
 * Implements exponential backoff, error classification, and retry logic
 */

'use server';

import { db } from '@/lib/db';
import { emailAccounts, syncJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { markSyncFailed } from './cursor-manager';

export type ErrorType =
  | 'network'
  | 'auth'
  | 'rate_limit'
  | 'invalid_data'
  | 'provider'
  | 'unknown';

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}

/**
 * Classify error type and determine if retryable
 */
export function classifyError(error: any): ErrorInfo {
  const message = error?.message || String(error);

  // Network errors
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT') ||
    message.includes('ENOTFOUND') ||
    message.includes('network') ||
    message.includes('fetch failed')
  ) {
    return {
      type: 'network',
      message: 'Network connection failed',
      retryable: true,
    };
  }

  // Authentication errors
  if (
    message.includes('401') ||
    message.includes('Unauthorized') ||
    message.includes('invalid_grant') ||
    message.includes('token') ||
    error?.status === 401
  ) {
    return {
      type: 'auth',
      message: 'Authentication failed - reconnect account',
      retryable: false, // Requires user action
    };
  }

  // Rate limiting
  if (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    error?.status === 429
  ) {
    const retryAfter = error?.headers?.['retry-after']
      ? parseInt(error.headers['retry-after'])
      : 60;

    return {
      type: 'rate_limit',
      message: 'Rate limit exceeded',
      retryable: true,
      retryAfter,
    };
  }

  // Provider errors (Gmail, Outlook, etc.)
  if (
    message.includes('provider') ||
    message.includes('503') ||
    message.includes('service unavailable') ||
    error?.status === 503
  ) {
    return {
      type: 'provider',
      message: 'Email provider temporarily unavailable',
      retryable: true,
      retryAfter: 300, // 5 minutes
    };
  }

  // Invalid data errors
  if (
    message.includes('400') ||
    message.includes('invalid') ||
    message.includes('malformed') ||
    error?.status === 400
  ) {
    return {
      type: 'invalid_data',
      message: 'Invalid data received',
      retryable: false,
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    message: message || 'Unknown error occurred',
    retryable: true, // Default to retryable
  };
}

/**
 * Calculate delay for exponential backoff
 * @param attemptNumber Starting from 1
 * @param baseDelay Base delay in seconds (default: 5)
 * @param maxDelay Maximum delay in seconds (default: 3600 = 1 hour)
 */
export function calculateBackoffDelay(
  attemptNumber: number,
  baseDelay: number = 5,
  maxDelay: number = 3600
): number {
  // Exponential backoff: delay = baseDelay * (2 ^ attemptNumber)
  const delay = baseDelay * Math.pow(2, attemptNumber - 1);

  // Add jitter (±20% randomness to prevent thundering herd)
  const jitter = delay * 0.2 * (Math.random() - 0.5);

  // Cap at maxDelay
  return Math.min(delay + jitter, maxDelay);
}

/**
 * Determine if sync should retry based on error count
 */
export function shouldRetrySync(
  errorInfo: ErrorInfo,
  consecutiveErrors: number,
  maxRetries: number = 5
): boolean {
  // Don't retry non-retryable errors
  if (!errorInfo.retryable) {
    return false;
  }

  // Don't retry if max attempts reached
  if (consecutiveErrors >= maxRetries) {
    return false;
  }

  return true;
}

/**
 * Handle sync error with retry logic
 */
export async function handleSyncError(
  accountId: string,
  error: any
): Promise<{
  shouldRetry: boolean;
  retryAfter?: number;
  errorInfo: ErrorInfo;
}> {
  const errorInfo = classifyError(error);

  // Get current error count
  const [account] = await db
    .select({
      consecutiveErrors: emailAccounts.consecutiveErrors,
      errorCount: emailAccounts.errorCount,
    })
    .from(emailAccounts)
    .where(eq(emailAccounts.id, accountId))
    .limit(1);

  const consecutiveErrors = (account?.consecutiveErrors || 0) + 1;
  const shouldRetry = shouldRetrySync(errorInfo, consecutiveErrors);

  // Update account with error
  await markSyncFailed(accountId, errorInfo.message);

  // Calculate retry delay
  let retryAfter: number | undefined;
  if (shouldRetry) {
    if (errorInfo.retryAfter) {
      retryAfter = errorInfo.retryAfter;
    } else {
      retryAfter = calculateBackoffDelay(consecutiveErrors);
    }

    // Schedule next attempt
    const nextAttempt = new Date(Date.now() + retryAfter * 1000);
    await db
      .update(emailAccounts)
      .set({
        nextScheduledSyncAt: nextAttempt,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));
  }

  return {
    shouldRetry,
    retryAfter,
    errorInfo,
  };
}

/**
 * Handle partial sync failure (some emails failed to sync)
 */
export async function handlePartialSyncError(
  accountId: string,
  totalEmails: number,
  failedEmails: number,
  errors: Error[]
): Promise<void> {
  const failureRate = failedEmails / totalEmails;

  // If failure rate is high (>25%), treat as full failure
  if (failureRate > 0.25) {
    const errorMessage = `Partial sync failure: ${failedEmails}/${totalEmails} emails failed`;
    await markSyncFailed(accountId, errorMessage);
  } else {
    // Log errors but mark sync as successful
    console.warn(`Partial sync errors for account ${accountId}:`, {
      total: totalEmails,
      failed: failedEmails,
      errors: errors.map((e) => e.message),
    });

    // Update error count but keep status as success
    await db
      .update(emailAccounts)
      .set({
        lastSyncError: `${failedEmails} emails failed to sync`,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));
  }
}

/**
 * Log error for monitoring
 */
export async function logSyncError(
  accountId: string,
  error: any,
  context?: Record<string, any>
): Promise<void> {
  const errorInfo = classifyError(error);

  // In production, send to logging service (e.g., Sentry, LogRocket)
  console.error('Sync error logged:', {
    accountId,
    errorType: errorInfo.type,
    errorMessage: errorInfo.message,
    retryable: errorInfo.retryable,
    context,
    timestamp: new Date().toISOString(),
  });

  // Could also store in a separate errors table for analytics
}
