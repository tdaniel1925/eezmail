import { useEffect, useRef, useState } from 'react';
import type { Email } from '@/db/schema';

interface SummaryCache {
  [emailId: string]: {
    summary: string;
    loading: boolean;
    error: boolean;
  };
}

/**
 * Hook to preload AI summaries for emails in the viewport
 * Automatically fetches summaries for visible emails in batches
 */
export function useViewportSummaries(
  emails: Email[],
  containerRef: React.RefObject<HTMLDivElement>
) {
  const [summaryCache, setSummaryCache] = useState<SummaryCache>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const emailElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const loadingQueueRef = useRef<Set<string>>(new Set());

  // Function to fetch summary for a single email
  const fetchSummary = async (emailId: string): Promise<void> => {
    // Skip if already loading or loaded
    if (
      loadingQueueRef.current.has(emailId) ||
      summaryCache[emailId]?.summary
    ) {
      return;
    }

    loadingQueueRef.current.add(emailId);

    setSummaryCache((prev) => ({
      ...prev,
      [emailId]: { summary: '', loading: true, error: false },
    }));

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }

      const data = await response.json();

      if (data.success && data.summary) {
        setSummaryCache((prev) => ({
          ...prev,
          [emailId]: { summary: data.summary, loading: false, error: false },
        }));
      } else {
        throw new Error('No summary in response');
      }
    } catch (error) {
      console.error(`Error fetching summary for ${emailId}:`, error);
      setSummaryCache((prev) => ({
        ...prev,
        [emailId]: { summary: '', loading: false, error: true },
      }));
    } finally {
      loadingQueueRef.current.delete(emailId);
    }
  };

  // Batch fetch summaries with throttling
  const batchFetchSummaries = async (emailIds: string[]): Promise<void> => {
    // Filter out already loading/loaded emails
    const emailsToFetch = emailIds.filter(
      (id) => !loadingQueueRef.current.has(id) && !summaryCache[id]?.summary
    );

    if (emailsToFetch.length === 0) return;

    // Fetch up to 5 summaries in parallel (increased from 3)
    const BATCH_SIZE = 5;
    const batches: string[][] = [];

    for (let i = 0; i < emailsToFetch.length; i += BATCH_SIZE) {
      batches.push(emailsToFetch.slice(i, i + BATCH_SIZE));
    }

    // Process all batches concurrently (no waiting between batches)
    await Promise.all(
      batches.map(async (batch, batchIndex) => {
        // Optional: stagger batch starts by 50ms to avoid overwhelming API
        if (batchIndex > 0) {
          await new Promise((resolve) => setTimeout(resolve, 50 * batchIndex));
        }
        await Promise.all(batch.map((id) => fetchSummary(id)));
      })
    );
  };

  // Set up Intersection Observer
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleEmailIds: string[] = [];

        entries.forEach((entry) => {
          const emailId = entry.target.getAttribute('data-email-id');
          if (!emailId) return;

          if (entry.isIntersecting) {
            // Email is visible - queue for summary loading
            visibleEmailIds.push(emailId);
          }
        });

        // Batch fetch summaries for visible emails (non-blocking)
        if (visibleEmailIds.length > 0) {
          console.log(
            `🔄 Preloading ${visibleEmailIds.length} AI summaries...`
          );
          batchFetchSummaries(visibleEmailIds);
        }
      },
      {
        root: containerRef.current,
        rootMargin: '300px', // Increased from 200px for earlier loading
        threshold: 0.1,
      }
    );

    // Observe all email elements
    emailElementsRef.current.forEach((element) => {
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef, emails]);

  // Register an email element for observation
  const registerEmailElement = (
    emailId: string,
    element: HTMLElement | null
  ) => {
    if (element) {
      emailElementsRef.current.set(emailId, element);
      // Observe immediately if observer exists
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    } else {
      // Unobserve and remove from map
      const existingElement = emailElementsRef.current.get(emailId);
      if (existingElement && observerRef.current) {
        observerRef.current.unobserve(existingElement);
      }
      emailElementsRef.current.delete(emailId);
    }
  };

  // Get summary for a specific email
  const getSummary = (emailId: string) => summaryCache[emailId];

  return {
    getSummary,
    registerEmailElement,
    summaryCache,
  };
}
