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
        // Revalidation settings - balanced for performance and freshness
        refreshInterval: 180000, // Revalidate every 3 minutes
        // Don't revalidate on mount to prevent loops
        revalidateIfStale: false,
        // Don't revalidate on focus to prevent loops
        revalidateOnFocus: false,
        // Revalidate when network reconnects
        revalidateOnReconnect: true,
        // Show cached data immediately while revalidating
        keepPreviousData: true,
        // Dedupe requests within 2 seconds
        dedupingInterval: 2000,
        // Retry on error
        errorRetryCount: 3,
        errorRetryInterval: 5000,
      }
    );

  return {
    emails: data?.emails || [],
    isLoading: isLoading && !data, // Only show loading if no cached data
    isValidating, // Background revalidation indicator
    error: error || (data && !data.success ? data.error : null),
    refresh: mutate, // Manual refresh function
    debug: data?.debug,
  };
}
