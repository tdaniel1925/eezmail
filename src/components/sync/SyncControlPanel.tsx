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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  syncEmailAccount,
  getSyncStatus,
  cancelSync,
} from '@/lib/sync/email-sync-service';
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
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [emailCount, setEmailCount] = useState(0);
  const [folderCount, setFolderCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Poll for status updates
  useEffect(() => {
    loadStatus();

    // Poll every 3 seconds when syncing, every 10 seconds otherwise
    const interval = setInterval(
      () => {
        loadStatus();
      },
      status === 'syncing' ? 3000 : 10000
    );

    return () => clearInterval(interval);
  }, [accountId, status]);

  const loadStatus = async () => {
    try {
      const result = await getSyncStatus(accountId);
      if (result && 'success' in result && result.success && 'data' in result) {
        setStatus(result.data.status as any);
        setLastSyncAt(
          result.data.lastSyncAt ? new Date(result.data.lastSyncAt) : null
        );
        setEmailCount(result.data.emailCount);
        setFolderCount(result.data.folderCount);
        setError(result.data.lastSyncError);
      } else if (result && 'error' in result) {
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

  const handleCancel = async () => {
    try {
      const result = await cancelSync(accountId);
      if (result.success) {
        toast.success('Sync cancelled');
        setStatus('active');
      } else {
        toast.error(result.error || 'Failed to cancel sync');
      }
    } catch (err) {
      toast.error('Failed to cancel sync');
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

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 rounded-lg bg-white/60 dark:bg-white/5">
          <Mail className="h-6 w-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {emailCount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Emails Synced
          </div>
        </div>

        <div className="text-center p-4 rounded-lg bg-white/60 dark:bg-white/5">
          <Folder className="h-6 w-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {folderCount}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Folders
          </div>
        </div>

        <div className="text-center p-4 rounded-lg bg-white/60 dark:bg-white/5">
          <Clock className="h-6 w-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatTimeAgo(lastSyncAt)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Last Sync
          </div>
        </div>
      </div>

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
              Syncing your emails...
            </p>
            <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse w-3/4" />
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
            This may take a few minutes depending on your mailbox size
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {status === 'syncing' ? (
          <Button
            onClick={handleCancel}
            variant="ghost"
            className="flex-1 border border-gray-300 dark:border-white/20"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Sync
          </Button>
        ) : (
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            variant="primary"
            className="flex-1"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        )}
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
