'use client';

/**
 * Sync Status Indicator
 * Shows real-time sync status with progress and controls
 */

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  X as XIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSyncStatus,
  startSync,
  pauseSync,
  cancelSync,
} from '@/lib/sync/actions';
import { toast } from '@/lib/toast';

interface SyncStatusIndicatorProps {
  accountId: string;
  accountEmail: string;
  className?: string;
}

type SyncStatus = 'idle' | 'syncing' | 'paused' | 'error' | 'success';

export function SyncStatusIndicator({
  accountId,
  accountEmail,
  className,
}: SyncStatusIndicatorProps): JSX.Element {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sync status
  const fetchStatus = async () => {
    try {
      const data = await getSyncStatus(accountId);
      if (data) {
        setStatus(data.syncStatus || 'idle');
        setProgress(data.syncProgress || 0);
        setTotal(data.syncTotal || 0);
        setLastSyncAt(data.lastSuccessfulSyncAt);
        setError(data.lastSyncError);
      }
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    }
  };

  // Poll status every 3 seconds when syncing
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(
      fetchStatus,
      status === 'syncing' ? 3000 : 10000
    );

    return () => clearInterval(interval);
  }, [accountId, status]);

  // Handle start sync
  const handleStartSync = async () => {
    setIsLoading(true);
    try {
      const result = await startSync(accountId, 'incremental');
      if (result.success) {
        toast.success(result.message || 'Sync started');
        await fetchStatus();
      } else {
        toast.error(result.error || 'Failed to start sync');
      }
    } catch (err) {
      toast.error('An error occurred while starting sync');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pause sync
  const handlePauseSync = async () => {
    setIsLoading(true);
    try {
      const result = await pauseSync(accountId);
      if (result.success) {
        toast.success('Sync paused');
        await fetchStatus();
      } else {
        toast.error(result.error || 'Failed to pause sync');
      }
    } catch (err) {
      toast.error('An error occurred while pausing sync');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel sync
  const handleCancelSync = async () => {
    setIsLoading(true);
    try {
      const result = await cancelSync(accountId);
      if (result.success) {
        toast.success('Sync cancelled');
        await fetchStatus();
      } else {
        toast.error(result.error || 'Failed to cancel sync');
      }
    } catch (err) {
      toast.error('An error occurred while cancelling sync');
    } finally {
      setIsLoading(false);
    }
  };

  // Render status icon
  const StatusIcon = () => {
    switch (status) {
      case 'syncing':
        return (
          <RefreshCw className={cn('h-4 w-4 text-blue-500 animate-spin')} />
        );
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400" />;
    }
  };

  // Render status text
  const getStatusText = () => {
    switch (status) {
      case 'syncing':
        return total > 0 ? `Syncing ${progress} of ${total}...` : 'Syncing...';
      case 'success':
        return lastSyncAt ? `Last synced ${getTimeAgo(lastSyncAt)}` : 'Synced';
      case 'error':
        return 'Sync failed';
      case 'paused':
        return 'Sync paused';
      default:
        return 'Not synced';
    }
  };

  // Get time ago helper
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Progress percentage
  const progressPercentage =
    total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        <StatusIcon />
      </div>

      {/* Status Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {accountEmail}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {getStatusText()}
        </div>
        {status === 'syncing' && total > 0 && (
          <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
        {status === 'error' && error && (
          <div className="mt-1 text-xs text-red-500 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {status === 'idle' && (
          <button
            onClick={handleStartSync}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Start sync"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}

        {status === 'syncing' && (
          <>
            <button
              onClick={handlePauseSync}
              disabled={isLoading}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Pause sync"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCancelSync}
              disabled={isLoading}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Cancel sync"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {status === 'paused' && (
          <button
            onClick={handleStartSync}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Resume sync"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        )}

        {status === 'error' && (
          <button
            onClick={handleStartSync}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Retry sync"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}

        {status === 'success' && (
          <button
            onClick={handleStartSync}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Sync now"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
