'use client';

import { useState, useEffect } from 'react';
import { EmailList } from './EmailList';
import { useAutoSync } from '@/hooks/useAutoSync';
import { getNewsFeedEmails } from '@/lib/email/get-emails';

interface AutoSyncNewsFeedProps {
  accountId: string;
}

export function AutoSyncNewsFeed({ accountId }: AutoSyncNewsFeedProps) {
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

  const fetchNewsFeedEmails = async () => {
    try {
      setIsLoading(true);
      const result = await getNewsFeedEmails();

      if (result.success) {
        const currentCount = result.emails.length;

        // Check for new emails
        if (previousEmailCount > 0 && currentCount > previousEmailCount) {
          const newCount = currentCount - previousEmailCount;
          setNewEmailsCount(newCount);

          // Clear the notification after 5 seconds
          setTimeout(() => setNewEmailsCount(0), 5000);
        }

        setEmails(result.emails);
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
    fetchNewsFeedEmails();
  }, [syncCount]); // Re-fetch when sync count changes

  // Manual refresh handler
  const handleRefresh = async () => {
    await triggerSync();
    await fetchNewsFeedEmails();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Auto-sync status indicator */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📰</span>
            <div>
              <h2 className="text-lg font-semibold text-green-800">NewsFeed</h2>
              <p className="text-sm text-green-600">
                Newsletters, news, and updates
              </p>
            </div>
          </div>

          {/* New emails notification */}
          {newEmailsCount > 0 && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              <span>📰</span>
              <span>
                {newEmailsCount} new newsletter{newEmailsCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Sync status indicator */}
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Updating NewsFeed...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">
                  NewsFeed active
                  {lastSyncAt && (
                    <span className="text-gray-500 ml-1">
                      (last: {lastSyncAt.toLocaleTimeString()})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Manual refresh button */}
        <button
          onClick={handleRefresh}
          disabled={isSyncing}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? 'Updating...' : 'Refresh NewsFeed'}
        </button>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-hidden">
        <EmailList
          emails={emails}
          title="NewsFeed"
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
