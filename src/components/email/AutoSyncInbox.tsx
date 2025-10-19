'use client';

import { useEffect, useCallback } from 'react';
import { EmailList } from './EmailList';
import { useAutoSync } from '@/hooks/useAutoSync';
import { useInboxEmails } from '@/hooks/useInboxEmails';

interface AutoSyncInboxProps {
  accountId: string;
  title?: string;
}

export function AutoSyncInbox({
  accountId,
  title = 'Inbox',
}: AutoSyncInboxProps) {
  // Use SWR for cached email fetching with aggressive revalidation
  const { emails, isLoading, isValidating, error, refresh } = useInboxEmails({
    limit: 25,
    enabled: true,
  });

  // Auto-sync in background
  const { isSyncing, lastSyncAt, syncCount, triggerSync } = useAutoSync({
    accountId,
    intervalMs: 180000, // 3 minutes
    enabled: true,
    initialSync: false,
  });

  // Immediately refresh emails after sync completes (optimistic update)
  useEffect(() => {
    if (syncCount > 0) {
      // Trigger immediate cache revalidation for instant UI update
      refresh();
      console.log('🔄 Cache refreshed after sync completion');
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
      isSyncing={isSyncing || isValidating}
      lastSyncAt={lastSyncAt}
      onRefresh={handleRefresh}
    />
  );
}
