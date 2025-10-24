'use client';

import { useEffect, useCallback } from 'react';
import { EmailList } from './EmailList';
import { useAutoSync } from '@/hooks/useAutoSync';
import { useInfiniteEmails } from '@/hooks/useInfiniteEmails';

interface AutoSyncInboxProps {
  accountId: string;
  title?: string;
}

export function AutoSyncInbox({
  accountId,
  title = 'Inbox',
}: AutoSyncInboxProps) {
  // Use infinite scroll hook for loading all emails
  const {
    emails,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    refresh,
  } = useInfiniteEmails({
    pageSize: 50, // Load 50 emails per batch (reduced from 100 for better performance)
    category: 'inbox',
    accountId,
  });

  // Auto-sync in background (DISABLED for performance)
  const { isSyncing, lastSyncAt, syncCount, triggerSync } = useAutoSync({
    accountId,
    intervalMs: 600000, // 10 minutes (increased from 3 minutes)
    enabled: false, // DISABLED - use manual sync only
    initialSync: false,
  });

  // Immediately refresh emails after sync completes (optimistic update)
  useEffect(() => {
    if (syncCount > 0) {
      // Trigger immediate cache revalidation for instant UI update
      refresh();
      console.log('🔄 Emails refreshed after sync completion');
    }
  }, [syncCount, refresh]);

  // Manual refresh handler with optimistic update
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');

    // Trigger sync and immediately refresh cache
    const syncPromise = triggerSync();
    const refreshPromise = refresh();

    // Wait for both to complete
    await Promise.all([syncPromise, refreshPromise]);

    console.log('✅ Manual refresh completed');
  }, [triggerSync, refresh]);

  return (
    <EmailList
      emails={emails}
      title={title}
      isLoading={isLoading}
      error={error || undefined}
      isSyncing={isSyncing || isLoadingMore}
      lastSyncAt={lastSyncAt}
      onRefresh={handleRefresh}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={loadMore}
    />
  );
}
