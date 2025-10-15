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
    <div className="flex flex-col h-full">
      {/* Auto-sync status indicator */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-gray-800 bg-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl">
            📧
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1 text-white">{title}</h2>
            <div className="flex items-center gap-3">
              {/* Sync status indicator */}
              {isSyncing ? (
                <div className="flex items-center gap-2 text-blue-300">
                  <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Syncing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">
                    Auto-sync active
                    {lastSyncAt && (
                      <span className="ml-1 text-gray-400">
                        (last: {lastSyncAt.toLocaleTimeString()})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* New emails notification */}
          {newEmailsCount > 0 && (
            <div className="flex items-center gap-2 bg-green-500/20 text-green-300 px-3 py-1.5 rounded-full text-sm font-medium animate-pulse">
              <span>📧</span>
              <span>
                {newEmailsCount} new email{newEmailsCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Manual refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isSyncing}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? 'Syncing...' : 'Refresh'}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-hidden">
        <EmailList
          emails={emails}
          title={title}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
