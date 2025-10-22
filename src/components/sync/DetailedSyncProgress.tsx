'use client';

import { useEffect, useState } from 'react';
import {
  RefreshCw,
  Folder,
  Mail,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface SyncStats {
  accountId: string;
  emailAddress: string;
  status: string;
  syncProgress: number;
  syncTotal: number;
  currentFolder?: string;
  foldersCompleted: number;
  foldersTotal: number;
  estimatedTimeRemaining?: string;
  syncSpeed?: number; // emails per second
  lastSyncAt?: Date | null;
}

interface DetailedSyncProgressProps {
  accountId: string;
}

export function DetailedSyncProgress({ accountId }: DetailedSyncProgressProps) {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial stats
    fetchSyncStats();

    // Poll every 2 seconds during sync
    const interval = setInterval(fetchSyncStats, 2000);

    return () => clearInterval(interval);
  }, [accountId]);

  const fetchSyncStats = async () => {
    try {
      const response = await fetch(`/api/sync/status/${accountId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">
        No sync data available
      </div>
    );
  }

  const percentComplete =
    stats.syncTotal > 0
      ? Math.round((stats.syncProgress / stats.syncTotal) * 100)
      : 0;

  const isSyncing = stats.status === 'syncing';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <RefreshCw
            className={`h-4 w-4 ${isSyncing ? 'animate-spin text-blue-500' : 'text-gray-400'}`}
          />
          Sync Progress
        </h4>
        <span
          className={`text-sm font-medium ${isSyncing ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}
        >
          {isSyncing ? 'In Progress' : 'Up to Date'}
        </span>
      </div>

      {/* Progress Bar */}
      {isSyncing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Overall Progress
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {percentComplete}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      )}

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Emails Synced */}
        <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <Mail className="h-4 w-4" />
            <span className="text-xs font-medium">Emails</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.syncProgress.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            of {stats.syncTotal.toLocaleString()} total
          </div>
        </div>

        {/* Folders */}
        <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <Folder className="h-4 w-4" />
            <span className="text-xs font-medium">Folders</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.foldersCompleted}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            of {stats.foldersTotal} complete
          </div>
        </div>

        {/* Sync Speed */}
        {isSyncing && stats.syncSpeed && (
          <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Speed</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.syncSpeed.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              emails/sec
            </div>
          </div>
        )}

        {/* Time Remaining */}
        {isSyncing && stats.estimatedTimeRemaining && (
          <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">ETA</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.estimatedTimeRemaining}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              remaining
            </div>
          </div>
        )}
      </div>

      {/* Current Activity */}
      {isSyncing && stats.currentFolder && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-900 dark:text-blue-100">
              Currently syncing:{' '}
              <span className="font-semibold">{stats.currentFolder}</span>
            </span>
          </div>
        </div>
      )}

      {/* Last Sync */}
      {!isSyncing && stats.lastSyncAt && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Last synced: {new Date(stats.lastSyncAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}


