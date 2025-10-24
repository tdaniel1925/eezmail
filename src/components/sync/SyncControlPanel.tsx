'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Folder,
  Mail,
  Clock,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { syncEmailAccount } from '@/lib/settings/email-actions';
import { toast } from '@/lib/toast';

interface SyncControlPanelProps {
  accountId: string;
  emailAddress: string;
}

export function SyncControlPanel({
  accountId,
  emailAddress,
}: SyncControlPanelProps) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'active' | 'error'>(
    'idle'
  );
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [emailCount, setEmailCount] = useState(0);
  const [folderCount, setFolderCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Poll for status updates with visibility detection
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const poll = () => {
      // Only poll if document is visible
      if (document.visibilityState === 'visible') {
        loadStatus();
      }
    };

    const startPolling = () => {
      poll(); // Initial load
      clearInterval(interval);
      // Poll frequently while syncing to show real-time updates
      const frequency = status === 'syncing' ? 2000 : 10000; // 2s when syncing, 10s when idle
      interval = setInterval(poll, frequency);
    };

    startPolling();

    // Restart polling when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        clearInterval(interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [accountId, status]);

  const loadStatus = async () => {
    try {
      // Call the new API endpoint for sync status
      const response = await fetch(`/api/email/sync?accountId=${accountId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setStatus(result.data.status as any);
        setSyncProgress(result.data.syncProgress || 0);
        setLastSyncAt(
          result.data.lastSyncAt ? new Date(result.data.lastSyncAt) : null
        );
        setEmailCount(result.data.emailCount || 0);
        setFolderCount(result.data.folderCount || 0);
        setError(result.data.lastSyncError);
      } else if (result.error) {
        console.error('Failed to load sync status:', result.error);
      }
    } catch (err) {
      console.error('Error loading sync status:', err);
      // Don't spam errors, just log once
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncEmailAccount(accountId);
      if (result.success) {
        toast.success('Email sync started!');
        setStatus('syncing');
        // Start polling more frequently
        loadStatus();
      } else {
        toast.error(result.error || 'Failed to start sync');
      }
    } catch (err) {
      toast.error('Failed to start sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'active':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'active':
        return 'Up to date';
      case 'error':
        return 'Sync error';
      default:
        return 'Not synced';
    }
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="rounded-lg border-2 border-gray-200 dark:border-white/10 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-white/5 dark:to-white/10 backdrop-blur-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Email Sync Control
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {emailAddress}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="text-center p-3 sm:p-4 rounded-lg bg-white/60 dark:bg-white/5">
          <Mail className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
          <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">
            {emailCount.toLocaleString()}
          </div>
          <div className="text-[0.6875rem] uppercase tracking-wider font-medium text-gray-600 dark:text-gray-400 mt-1">
            Emails Synced
          </div>
        </div>

        <div className="text-center p-3 sm:p-4 rounded-lg bg-white/60 dark:bg-white/5">
          <Folder className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
          <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">
            {folderCount}
          </div>
          <div className="text-[0.6875rem] uppercase tracking-wider font-medium text-gray-600 dark:text-gray-400 mt-1">
            Folders
          </div>
        </div>

        <div className="text-center p-3 sm:p-4 rounded-lg bg-white/60 dark:bg-white/5">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
          <div
            className="text-sm font-semibold text-gray-900 dark:text-white cursor-help"
            suppressHydrationWarning
            title={
              lastSyncAt
                ? new Date(lastSyncAt).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })
                : 'Never synced'
            }
          >
            {formatTimeAgo(lastSyncAt)}
          </div>
          <div className="text-[0.6875rem] uppercase tracking-wider font-medium text-gray-600 dark:text-gray-400 mt-1">
            Last Sync
          </div>
        </div>
      </div>

      {/* Empty State for Zero Emails */}
      {emailCount === 0 && status === 'active' && lastSyncAt && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-100 text-sm">
                No emails found in this account
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                This is normal for newly created accounts. If you&apos;re
                expecting emails:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300 list-disc list-inside">
                <li>Check if you&apos;re logged into the correct account</li>
                <li>Verify folder settings (some folders may be excluded)</li>
                <li>Wait a few minutes and sync again</li>
              </ul>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                onClick={handleSync}
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Sync Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Sync Error
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sync Progress */}
      {status === 'syncing' && (
        <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {syncProgress === 0
                ? 'Initializing sync...'
                : `Syncing your emails... ${syncProgress}%`}
            </p>
            <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${syncProgress === 0 ? 10 : syncProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {emailCount === 0 && folderCount === 0 && syncProgress === 0 ? (
                <>Connecting to Microsoft Graph API...</>
              ) : (
                <>
                  {emailCount.toLocaleString()} emails synced • {folderCount}{' '}
                  folders
                </>
              )}
            </p>
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">
              {syncProgress === 0
                ? 'Connecting...'
                : syncProgress < 10
                  ? 'Fetching folders...'
                  : syncProgress < 90
                    ? 'Syncing folders...'
                    : syncProgress < 100
                      ? 'Finalizing...'
                      : 'Complete!'}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSync}
          disabled={isSyncing || status === 'syncing'}
          variant="primary"
          className="flex-1"
        >
          {isSyncing || status === 'syncing' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Now
            </>
          )}
        </Button>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Auto-sync:</strong> Your emails sync automatically every 15
          minutes. Click "Sync Now" to force an immediate sync.
        </p>
      </div>
    </div>
  );
}
