'use client';

import { useState, useEffect } from 'react';
import { EmailList } from './EmailList';
import { useAutoSync } from '@/hooks/useAutoSync';
import { getReceiptsEmails } from '@/lib/email/get-emails';

interface AutoSyncReceiptsProps {
  accountId: string;
}

export function AutoSyncReceipts({ accountId }: AutoSyncReceiptsProps) {
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousEmailCount, setPreviousEmailCount] = useState(0);
  const [newEmailsCount, setNewEmailsCount] = useState(0);

  const { isSyncing, lastSyncAt, syncCount, triggerSync } = useAutoSync({
    accountId,
    intervalMs: 30000,
    enabled: true,
  });

  const fetchReceiptsEmails = async () => {
    try {
      setIsLoading(true);
      const result = await getReceiptsEmails();

      if (result.success) {
        const currentCount = result.emails.length;

        if (previousEmailCount > 0 && currentCount > previousEmailCount) {
          const newCount = currentCount - previousEmailCount;
          setNewEmailsCount(newCount);
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

  useEffect(() => {
    fetchReceiptsEmails();
  }, [syncCount]);

  const handleRefresh = async () => {
    await triggerSync();
    await fetchReceiptsEmails();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <div>
              <h2 className="text-lg font-semibold text-purple-800">
                Receipts
              </h2>
              <p className="text-sm text-purple-600">
                Financial transactions and receipts
              </p>
            </div>
          </div>

          {newEmailsCount > 0 && (
            <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              <span>💳</span>
              <span>
                {newEmailsCount} new receipt{newEmailsCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {isSyncing ? (
              <div className="flex items-center gap-2 text-purple-600">
                <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Syncing receipts...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">
                  Receipts active
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

        <button
          onClick={handleRefresh}
          disabled={isSyncing}
          className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? 'Syncing...' : 'Refresh Receipts'}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <EmailList
          emails={emails}
          title="Receipts"
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
