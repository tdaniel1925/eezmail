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
  userMessage: string; // User-friendly explanation
  actionMessage?: string; // What the user should do
  retryable: boolean;
  retryAfter?: number; // seconds
  helpUrl?: string; // Link to relevant help documentation
}

/**
 * Classify error type and determine if retryable
 * Now includes user-friendly messages and recovery guidance
 */
export function classifyError(error: any): ErrorInfo {
  const message = error?.message || String(error);

  console.log('[ERROR] Classifying error:', {
    message,
    status: error?.status,
    type: typeof error,
  });

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
      userMessage:
        'Unable to connect to the server. Please check your internet connection.',
      actionMessage:
        "We'll automatically retry in a moment. If this persists, check your network settings.",
      retryable: true,
      helpUrl: '/help/troubleshoot-network',
    };
  }

  // Authentication errors (401, 403)
  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('Unauthorized') ||
    message.includes('Forbidden') ||
    message.includes('invalid_grant') ||
    message.includes('token') ||
    message.includes('Access Denied') ||
    message.includes('ErrorAccessDenied') ||
    error?.status === 401 ||
    error?.status === 403
  ) {
    return {
      type: 'auth',
      message: 'Authentication failed - reconnect account',
      userMessage:
        'Your account needs to reconnect. This happens when passwords change or permissions expire.',
      actionMessage: 'Click "Reconnect Account" to fix this in 30 seconds.',
      retryable: false, // Requires user action
      helpUrl: '/help/reconnect-account',
    };
  }

  // Rate limiting (429)
  if (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    error?.status === 429
  ) {
    const retryAfter = error?.headers?.['retry-after']
      ? parseInt(error.headers['retry-after'])
      : 60;

    const minutes = Math.ceil(retryAfter / 60);

    return {
      type: 'rate_limit',
      message: 'Rate limit exceeded',
      userMessage: `The email provider's servers are busy right now.`,
      actionMessage: `We'll automatically retry in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}. No action needed.`,
      retryable: true,
      retryAfter,
    };
  }

  // Provider errors (503, service unavailable)
  if (
    message.includes('provider') ||
    message.includes('503') ||
    message.includes('service unavailable') ||
    message.includes('maintenance') ||
    error?.status === 503
  ) {
    return {
      type: 'provider',
      message: 'Email provider temporarily unavailable',
      userMessage:
        'The email provider is temporarily unavailable. This usually resolves within a few minutes.',
      actionMessage:
        "We'll automatically retry in 5 minutes. Check the provider status page if this continues.",
      retryable: true,
      retryAfter: 300, // 5 minutes
      helpUrl: '/help/provider-status',
    };
  }

  // Invalid data errors (400)
  if (
    message.includes('400') ||
    message.includes('invalid') ||
    message.includes('malformed') ||
    error?.status === 400
  ) {
    return {
      type: 'invalid_data',
      message: 'Invalid data received',
      userMessage: 'There was a problem with the sync data format.',
      actionMessage:
        'Try reconnecting your account. If this persists, contact support.',
      retryable: false,
      helpUrl: '/help/sync-errors',
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    message: message || 'Unknown error occurred',
    userMessage: 'An unexpected error occurred during sync.',
    actionMessage:
      "We'll try again automatically. If this persists, try reconnecting your account.",
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
