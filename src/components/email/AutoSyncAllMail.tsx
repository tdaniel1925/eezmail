'use client';

import { useState, useEffect } from 'react';
import { EmailList } from './EmailList';
import { useAutoSync } from '@/hooks/useAutoSync';
import { getAllMailEmails } from '@/lib/email/get-emails';

interface AutoSyncAllMailProps {
  accounts: any[];
  title?: string;
}

export function AutoSyncAllMail({
  accounts,
  title = 'All Mail',
}: AutoSyncAllMailProps) {
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousEmailCount, setPreviousEmailCount] = useState(0);
  const [newEmailsCount, setNewEmailsCount] = useState(0);

  // Use the first active account for sync (or first account if none active)
  const activeAccount = accounts.find((acc) => acc.status === 'active') || accounts[0];

  const { isSyncing, lastSyncAt, syncCount, triggerSync } = useAutoSync({
    accountId: activeAccount?.id || '',
    intervalMs: 180000, // 3 minutes
    enabled: !!activeAccount,
    initialSync: false,
  });

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      const result = await getAllMailEmails();

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
  }, [syncCount]);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (activeAccount) {
      await triggerSync();
    }
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


