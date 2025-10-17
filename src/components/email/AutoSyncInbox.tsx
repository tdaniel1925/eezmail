'use client';

import { useState, useEffect } from 'react';
import { EmailList } from './EmailList';
import { useAutoSync } from '@/hooks/useAutoSync';
import { getInboxEmails } from '@/lib/email/get-emails';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AutoSyncInboxProps {
  accountId: string;
  title?: string;
}

export function AutoSyncInbox({
  accountId,
  title = 'Inbox',
}: AutoSyncInboxProps) {
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousEmailCount, setPreviousEmailCount] = useState(0);
  const [newEmailsCount, setNewEmailsCount] = useState(0);

  const { isSyncing, lastSyncAt, syncCount, triggerSync } = useAutoSync({
    accountId,
    intervalMs: 180000, // 3 minutes (optimized for performance)
    enabled: true,
    initialSync: false, // Manual refresh button available
  });

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      const result = await getInboxEmails();

      if (result.success) {
        const newEmails = result.emails;
        const currentCount = newEmails.length;

        // Check for new emails
        if (previousEmailCount > 0 && currentCount > previousEmailCount) {
          const newCount = currentCount - previousEmailCount;
          setNewEmailsCount(newCount);

          // Clear the notification after 5 seconds
          setTimeout(() => setNewEmailsCount(0), 5000);
        }

        setEmails(newEmails);
        setPreviousEmailCount(currentCount);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch emails');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch emails on mount and when sync completes
  useEffect(() => {
    fetchEmails();
  }, [syncCount]); // Re-fetch when sync count changes

  // Manual refresh handler
  const handleRefresh = async () => {
    await triggerSync();
    await fetchEmails();
  };

  return (
    <EmailList
      emails={emails}
      title={title}
      isLoading={isLoading}
      error={error}
      isSyncing={isSyncing}
      lastSyncAt={lastSyncAt}
      onRefresh={handleRefresh}
      newEmailsCount={newEmailsCount}
    />
  );
}
