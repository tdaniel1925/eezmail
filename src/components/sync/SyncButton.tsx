'use client';

/**
 * Compact Sync Button
 * Simple button to trigger manual sync
 */

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startSync } from '@/lib/sync/actions';
import { toast } from '@/lib/toast';

interface SyncButtonProps {
  accountId: string;
  variant?: 'default' | 'icon' | 'text';
  className?: string;
}

export function SyncButton({
  accountId,
  variant = 'default',
  className,
}: SyncButtonProps): JSX.Element {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    const toastId = `sync-${accountId}`;
    toast.loading('Starting sync...');

    try {
      const result = await startSync(accountId, 'incremental');

      if (result.success) {
        toast.success(result.message || 'Sync completed');
      } else {
        toast.error(result.error || 'Sync failed');
      }
    } catch (error) {
      toast.error('An error occurred while syncing');
    } finally {
      setIsSyncing(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={cn(
          'p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        title="Sync emails"
      >
        <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={cn(
          'text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className={cn(
        'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium',
        className
      )}
    >
      <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
      {isSyncing ? 'Syncing...' : 'Sync Now'}
    </button>
  );
}
