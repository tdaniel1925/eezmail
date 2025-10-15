'use client';

import { useState, useEffect } from 'react';
import { EmailList } from './EmailList';
import { useAutoSync } from '@/hooks/useAutoSync';
import { getEmailsByFolder } from '@/lib/email/get-emails';

interface AutoSyncStarredProps {
  accountId: string;
}

export function AutoSyncStarred({ accountId }: AutoSyncStarredProps) {
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousEmailCount, setPreviousEmailCount] = useState(0);
  const [newEmailsCount, setNewEmailsCount] = useState(0);

  const { isSyncing, lastSyncAt, syncCount, triggerSync } = useAutoSync({
    accountId,
    intervalMs: 30000, // 30 seconds
    enabled: true,
  });

  const fetchStarredEmails = async () => {
    try {
      setIsLoading(true);
      const result = await getEmailsByFolder('starred');

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
    fetchStarredEmails();
  }, [syncCount]); // Re-fetch when sync count changes

  // Manual refresh handler
  const handleRefresh = async () => {
    await triggerSync();
    await fetchStarredEmails();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Auto-sync status indicator */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <div>
              <h2 className="text-lg font-semibold text-yellow-800">Starred</h2>
              <p className="text-sm text-yellow-600">Your starred emails</p>
            </div>
          </div>

          {/* New emails notification */}
          {newEmailsCount > 0 && (
            <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              <span>⭐</span>
              <span>
                {newEmailsCount} new starred email
                {newEmailsCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Sync status indicator */}
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <div className="flex items-center gap-2 text-yellow-600">
                <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Syncing stars...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">
                  Stars synced
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
          className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? 'Syncing...' : 'Refresh Stars'}
        </button>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-hidden">
        <EmailList
          emails={emails}
          title="Starred"
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
