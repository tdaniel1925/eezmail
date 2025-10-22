'use client';

import useSWR from 'swr';

export interface FolderCounts {
  inbox: number;
  sent: number;
  drafts: number;
  starred: number;
  unscreened: number;
  newsfeed: number;
  receipts: number;
  spam: number;
  trash: number;
  allMail: number;
  unread: number;
  replyQueue: number;
}

const fetcher = async (url: string): Promise<FolderCounts> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch folder counts');
  const data = await res.json();
  return data.counts;
};

/**
 * Hook to fetch all folder counts in a single API request
 * Replaces multiple separate calls with one optimized batch query
 *
 * Features:
 * - Automatic caching with SWR
 * - Auto-refresh every 30 seconds
 * - Instant display from cache
 * - Background revalidation
 */
export function useFolderCounts() {
  const { data, error, isLoading, mutate } = useSWR<FolderCounts>(
    '/api/folders/counts',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 2000, // Dedupe requests within 2 seconds
    }
  );

  return {
    counts: data ?? {
      inbox: 0,
      sent: 0,
      drafts: 0,
      starred: 0,
      unscreened: 0,
      newsfeed: 0,
      receipts: 0,
      spam: 0,
      trash: 0,
      allMail: 0,
      unread: 0,
      replyQueue: 0,
    },
    isLoading,
    error,
    refresh: mutate, // Manual refresh trigger
  };
}
