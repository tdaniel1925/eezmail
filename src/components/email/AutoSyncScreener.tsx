'use client';

import { useState, useEffect } from 'react';
import { ScreenerCard } from '@/components/screener/ScreenerCard';
import { useAutoSync } from '@/hooks/useAutoSync';
import { getCustomFolders } from '@/lib/folders/actions';
import { screenEmail } from '@/lib/screener/actions';
import { toast } from '@/lib/toast';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UnifiedHeader } from '@/components/layout/UnifiedHeader';
import type { Email, CustomFolder } from '@/db/schema';

interface AutoSyncScreenerProps {
  accountId: string;
}

export function AutoSyncScreener({ accountId }: AutoSyncScreenerProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);
  const [userId, setUserId] = useState<string>('');

  const { isSyncing, syncCount, triggerSync } = useAutoSync({
    accountId,
    intervalMs: 180000, // 3 minutes (optimized for performance)
    enabled: true,
    initialSync: false, // Manual refresh button available
  });

  const fetchScreenerData = async () => {
    try {
      setIsLoading(true);

      // Fetch unscreened emails via API
      const response = await fetch('/api/email/unscreened?limit=25');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEmails(data.emails);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch emails');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch emails');
      }

      // Fetch custom folders
      const foldersResult = await getCustomFolders();
      if (foldersResult.success) {
        setCustomFolders(foldersResult.folders);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when sync completes
  useEffect(() => {
    fetchScreenerData();
  }, [syncCount]);

  // Get user ID from first email
  useEffect(() => {
    if (emails.length > 0 && emails[0].accountId) {
      // We'll need to get userId from the account
      // For now, use a placeholder - you should fetch the actual userId
      setUserId(accountId);
    }
  }, [emails, accountId]);

  const handleDecision = async (
    emailId: string,
    decision: 'inbox' | 'newsfeed' | 'receipts' | 'spam' | string
  ) => {
    try {
      // Call server action to update email category
      const result = await screenEmail(emailId, decision);

      if (result.success) {
        toast.success(`Email moved to ${decision}`);

        // Remove the screened email from the list immediately
        const updatedEmails = emails.filter((email) => email.id !== emailId);
        setEmails(updatedEmails);

        // If no more emails, fetch fresh data
        if (updatedEmails.length === 0) {
          await fetchScreenerData();
          setCurrentEmailIndex(0);
        } else {
          // Stay on current index (which now shows the next email)
          // If we're at the end, go back one
          if (currentEmailIndex >= updatedEmails.length) {
            setCurrentEmailIndex(Math.max(0, updatedEmails.length - 1));
          }
        }
      } else {
        toast.error(result.error || 'Failed to screen email');
      }
    } catch (error) {
      console.error('Error screening email:', error);
      toast.error('Failed to screen email');
    }
  };

  const handleRefresh = async () => {
    await triggerSync();
    await fetchScreenerData();
    setCurrentEmailIndex(0);
  };

  // Current email to display
  const currentEmail = emails[currentEmailIndex];

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black/50">
      {/* Unified Header */}
      <UnifiedHeader
        title="Screener"
        subtitle={`${emails.length} email${emails.length !== 1 ? 's' : ''} to screen`}
        onRefresh={handleRefresh}
        isRefreshing={isSyncing}
        customActions={
          <>
            {/* Sync status */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
              {isSyncing ? (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Syncing...
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Up to date
                  </span>
                </>
              )}
            </div>
          </>
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading emails...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                All Caught Up!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No emails need screening right now
              </p>
            </div>
          </div>
        ) : currentEmail ? (
          <div className="max-w-5xl mx-auto" key={currentEmail.id}>
            <div className="mb-4 text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Email {currentEmailIndex + 1} of {emails.length}
              </span>
            </div>
            <ScreenerCard
              key={currentEmail.id}
              email={currentEmail}
              userId={userId}
              customFolders={customFolders}
              onDecision={handleDecision}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
