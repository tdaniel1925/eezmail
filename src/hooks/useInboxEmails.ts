'use client';

import useSWR from 'swr';

interface UseInboxEmailsOptions {
  limit?: number;
  enabled?: boolean;
}

interface InboxEmailsResponse {
  success: boolean;
  emails: any[];
  error?: string;
  debug?: any;
}

/**
 * Custom hook for fetching and caching inbox emails with SWR
 * - Caches emails for instant display on navigation
 * - Revalidates aggressively for real-time feel
 * - Shows stale data while revalidating (no loading flicker)
 * - Optimized for instant + real-time loading
 */
export function useInboxEmails(options: UseInboxEmailsOptions = {}) {
  const { limit = 25, enabled = true } = options;

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<InboxEmailsResponse>(
      enabled ? `/api/email/inbox?limit=${limit}` : null,
      async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch emails');
        }
        return response.json();
      },
      {
        // Revalidation settings - INSTANT LOAD with aggressive caching
        refreshInterval: 180000, // Revalidate every 3 minutes in background

        // CRITICAL: Always use cached data first (instant load)
        revalidateIfStale: true, // Revalidate in background if stale
        revalidateOnMount: true, // Revalidate on mount (but show cache first)
        revalidateOnFocus: true, // Revalidate when tab becomes active
        revalidateOnReconnect: true, // Revalidate when network reconnects

        // CRITICAL: Show cached data immediately while revalidating
        keepPreviousData: true, // Never show loading state if we have cached data

        // Dedupe requests within 2 seconds
        dedupingInterval: 2000,

        // Retry on error
        errorRetryCount: 3,
        errorRetryInterval: 5000,

        // Cache the response so it's instantly available
        suspense: false, // Don't use suspense mode (we want instant cache)

        // Fallback data while first loading
        fallbackData: undefined,
      }
    );

  return {
    emails: data?.emails || [],
    isLoading: isLoading && !data, // Only show loading if no cached data exists
    isValidating, // Background revalidation indicator
    error: error || (data && !data.success ? data.error : null),
    refresh: mutate, // Manual refresh function
    debug: data?.debug,
  };
}
