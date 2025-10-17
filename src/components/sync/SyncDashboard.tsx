'use client';

/**
 * Enhanced Sync Dashboard with Real-Time SSE Updates
 * Shows live sync progress, email counts, rates, and ETAs
 */

import { useEffect, useState, useRef } from 'react';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  TrendingUp,
  Zap,
  AlertTriangle,
  Pause,
  Play,
  X as XIcon,
} from 'lucide-react';
import {
  pauseSync,
  resumeSync,
  triggerManualSync,
} from '@/lib/sync/sync-controls';
import { toast } from '@/lib/toast';

interface SyncProgress {
  accountId: string;
  email: string;
  status: string;
  progress: number;
  total: number;
  percentage: number;
  eta: string;
  rate: number; // emails per second
  lastSyncAt?: string;
  error?: string;
  priority?: string;
}

interface Account {
  id: string;
  emailAddress: string;
  provider: string;
}

interface SyncDashboardProps {
  accounts: Account[];
}

export function SyncDashboard({ accounts }: SyncDashboardProps): JSX.Element {
  const [syncData, setSyncData] = useState<Map<string, SyncProgress>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());
  const progressHistoryRef = useRef<
    Map<string, Array<{ time: number; progress: number }>>
  >(new Map());

  useEffect(() => {
    if (accounts.length === 0) return;

    // Create SSE connections for each account
    accounts.forEach((account) => {
      // Skip if already connected
      if (eventSourcesRef.current.has(account.id)) return;

      const eventSource = new EventSource(
        `/api/sync/stream?accountId=${account.id}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log(`✅ SSE connected for account: ${data.accountId}`);
            return;
          }

          if (data.type === 'update') {
            setSyncData((prev) => {
              const newMap = new Map(prev);

              // Calculate percentage
              const percentage =
                data.total > 0
                  ? Math.round((data.progress / data.total) * 100)
                  : 0;

              // Calculate rate and ETA
              const rate = calculateRate(data.accountId, data.progress);
              const remaining = data.total - data.progress;
              const eta =
                rate > 0 ? formatETA(remaining / rate) : 'Calculating...';

              newMap.set(account.id, {
                ...data,
                percentage,
                rate,
                eta,
              });

              return newMap;
            });
          }

          if (data.type === 'error') {
            console.error(`SSE error for account ${account.id}:`, data.error);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`SSE connection error for account ${account.id}:`, error);
        eventSource.close();
        eventSourcesRef.current.delete(account.id);
      };

      eventSourcesRef.current.set(account.id, eventSource);
    });

    // Cleanup on unmount
    return () => {
      eventSourcesRef.current.forEach((es) => es.close());
      eventSourcesRef.current.clear();
    };
  }, [accounts]);

  // Calculate sync rate (emails per second)
  const calculateRate = (
    accountId: string,
    currentProgress: number
  ): number => {
    const now = Date.now();
    const history = progressHistoryRef.current.get(accountId) || [];

    // Add current progress
    history.push({ time: now, progress: currentProgress });

    // Keep only last 10 seconds of history
    const recentHistory = history.filter((h) => now - h.time <= 10000);
    progressHistoryRef.current.set(accountId, recentHistory);

    if (recentHistory.length < 2) return 0;

    // Calculate rate based on progress over time
    const oldest = recentHistory[0];
    const newest = recentHistory[recentHistory.length - 1];
    const timeDiff = (newest.time - oldest.time) / 1000; // seconds
    const progressDiff = newest.progress - oldest.progress;

    return timeDiff > 0 ? Math.round(progressDiff / timeDiff) : 0;
  };

  // Format ETA
  const formatETA = (seconds: number): string => {
    if (!isFinite(seconds) || seconds <= 0) return 'Unknown';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  // Handle pause sync
  const handlePause = async (accountId: string) => {
    setIsLoading((prev) => ({ ...prev, [accountId]: true }));
    try {
      const result = await pauseSync(accountId);
      if (result.success) {
        toast.success('Sync paused');
      } else {
        toast.error(result.error || 'Failed to pause sync');
      }
    } catch (error) {
      toast.error('Failed to pause sync');
    } finally {
      setIsLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  // Handle resume sync
  const handleResume = async (accountId: string) => {
    setIsLoading((prev) => ({ ...prev, [accountId]: true }));
    try {
      const result = await resumeSync(accountId);
      if (result.success) {
        toast.success('Sync resumed');
      } else {
        toast.error(result.error || 'Failed to resume sync');
      }
    } catch (error) {
      toast.error('Failed to resume sync');
    } finally {
      setIsLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  // Handle manual sync
  const handleManualSync = async (accountId: string) => {
    setIsLoading((prev) => ({ ...prev, [accountId]: true }));
    try {
      const result = await triggerManualSync(accountId);
      if (result.success) {
        toast.success(`Synced ${result.syncedCount || 0} emails`);
      } else {
        toast.error(result.error || 'Failed to sync');
      }
    } catch (error) {
      toast.error('Failed to trigger sync');
    } finally {
      setIsLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  // Calculate aggregate stats
  const stats = {
    totalSynced: Array.from(syncData.values()).reduce(
      (sum, s) => sum + s.progress,
      0
    ),
    totalRate: Array.from(syncData.values()).reduce(
      (sum, s) => sum + s.rate,
      0
    ),
    activeSyncs: Array.from(syncData.values()).filter(
      (s) => s.status === 'syncing'
    ).length,
    completed: Array.from(syncData.values()).filter((s) => s.percentage === 100)
      .length,
    errors: Array.from(syncData.values()).filter((s) => s.status === 'error')
      .length,
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No email accounts connected</p>
        <p className="text-sm mt-1">Add an account to start syncing emails</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={RefreshCw}
          label="Total Emails Synced"
          value={stats.totalSynced.toLocaleString()}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Sync Rate"
          value={`${stats.totalRate} /s`}
          color="green"
        />
        <StatCard
          icon={Zap}
          label="Active Syncs"
          value={stats.activeSyncs}
          color="yellow"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completed}
          color="green"
        />
      </div>

      {/* Per-Account Progress */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Account Sync Status
        </h3>

        {accounts.map((account) => {
          const progress = syncData.get(account.id);

          return (
            <div
              key={account.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {account.emailAddress}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {progress?.status === 'syncing' &&
                      `Syncing at ${progress.rate} emails/sec`}
                    {progress?.status === 'success' && 'Sync complete'}
                    {progress?.status === 'paused' && 'Sync paused'}
                    {progress?.status === 'error' &&
                      `Error: ${progress.error || 'Unknown error'}`}
                    {(!progress || progress.status === 'idle') &&
                      'Ready to sync'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Progress Percentage */}
                  {progress && (
                    <div className="text-right mr-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {progress.percentage}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {progress.progress.toLocaleString()} /{' '}
                        {progress.total.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {progress?.status === 'syncing' && (
                    <button
                      onClick={() => handlePause(account.id)}
                      disabled={isLoading[account.id]}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Pause sync"
                    >
                      <Pause size={18} />
                    </button>
                  )}
                  {progress?.status === 'paused' && (
                    <button
                      onClick={() => handleResume(account.id)}
                      disabled={isLoading[account.id]}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Resume sync"
                    >
                      <Play size={18} />
                    </button>
                  )}
                  {(!progress ||
                    progress.status === 'idle' ||
                    progress.status === 'error') && (
                    <button
                      onClick={() => handleManualSync(account.id)}
                      disabled={isLoading[account.id]}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Start sync"
                    >
                      <RefreshCw size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {progress && progress.total > 0 && (
                <div>
                  <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>

                  {/* ETA and Details */}
                  {progress.status === 'syncing' && (
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {progress.total - progress.progress > 0 &&
                          `${(progress.total - progress.progress).toLocaleString()} emails remaining`}
                      </span>
                      <span>ETA: {progress.eta}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${colorClasses[color]}`} />
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
