'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Email } from '@/db/schema';

interface UseInfiniteEmailsOptions {
  initialEmails?: Email[];
  pageSize?: number;
  category?: string;
  accountId?: string;
}

interface UseInfiniteEmailsReturn {
  emails: Email[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for infinite scroll email loading
 * Loads emails in batches as user scrolls
 */
export function useInfiniteEmails(
  options: UseInfiniteEmailsOptions = {}
): UseInfiniteEmailsReturn {
  const {
    initialEmails = [],
    pageSize = 50,
    category = 'inbox',
    accountId,
  } = options;

  const [emails, setEmails] = useState<Email[]>(initialEmails);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load initial batch
  useEffect(() => {
    if (initialEmails.length === 0 && !isLoadingRef.current) {
      loadInitial();
    }
  }, [category, accountId]);

  const loadInitial = async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        limit: pageSize.toString(),
        offset: '0',
      });

      if (category) {
        queryParams.set('category', category);
      }

      if (accountId) {
        queryParams.set('accountId', accountId);
      }

      const response = await fetch(
        `/api/email/inbox?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();

      if (!isMountedRef.current) return;

      const fetchedEmails = data.emails || [];
      setEmails(fetchedEmails);
      setOffset(fetchedEmails.length);
      setHasMore(fetchedEmails.length === pageSize);
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Error loading emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to load emails');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }
  };

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || isLoadingMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });

      if (category) {
        queryParams.set('category', category);
      }

      if (accountId) {
        queryParams.set('accountId', accountId);
      }

      const response = await fetch(
        `/api/email/inbox?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch more emails');
      }

      const data = await response.json();

      if (!isMountedRef.current) return;

      const fetchedEmails = data.emails || [];

      if (fetchedEmails.length > 0) {
        setEmails((prev) => [...prev, ...fetchedEmails]);
        setOffset((prev) => prev + fetchedEmails.length);
        setHasMore(fetchedEmails.length === pageSize);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Error loading more emails:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load more emails'
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    }
  }, [offset, hasMore, isLoadingMore, pageSize, category, accountId]);

  const refresh = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    isLoadingRef.current = false;
    await loadInitial();
  }, [category, accountId, pageSize]);

  return {
    emails,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
