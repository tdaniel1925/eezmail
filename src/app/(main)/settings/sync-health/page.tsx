// src/app/(main)/settings/sync-health/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Mail,
  TrendingUp,
  XCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { getSyncHealthData } from './actions';

interface SyncHealthData {
  accounts: Array<{
    id: string;
    email: string;
    provider: string;
    status: string;
    lastSyncAt: Date | null;
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    avgDurationMs: number;
    totalMessagesProcessed: number;
    totalMessagesFailed: number;
    totalDuplicatesFound: number;
    totalRateLimitHits: number;
  }>;
  overall: {
    totalAccounts: number;
    activeAccounts: number;
    healthyAccounts: number;
    unhealthyAccounts: number;
    avgSuccessRate: number;
    totalMessagesProcessed: number;
    totalSyncsLast24h: number;
  };
  recentFailures: Array<{
    id: string;
    accountEmail: string;
    messageId: string;
    subject: string | null;
    errorType: string;
    errorMessage: string;
    retryCount: number;
    createdAt: Date;
  }>;
}

export default function SyncHealthPage() {
  const [healthData, setHealthData] = useState<SyncHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      const data = await getSyncHealthData();
      setHealthData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !healthData) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No health data available</p>
      </div>
    );
  }

  const { accounts, overall, recentFailures } = healthData;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sync Health Monitor
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Real-time monitoring of email synchronization
            </p>
          </div>
          <button
            onClick={loadHealthData}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Overall Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Accounts
                </p>
                <p className="text-2xl font-bold">{overall.totalAccounts}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Healthy Accounts
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {overall.healthyAccounts}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Success Rate
                </p>
                <p className="text-2xl font-bold">
                  {overall.avgSuccessRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Messages Processed
                </p>
                <p className="text-2xl font-bold">
                  {overall.totalMessagesProcessed.toLocaleString()}
                </p>
              </div>
              <Database className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Account Status */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Account Status</h2>
          <div className="space-y-3">
            {accounts.map((account) => {
              const successRate =
                account.totalSyncs > 0
                  ? (account.successfulSyncs / account.totalSyncs) * 100
                  : 0;
              const isHealthy = successRate >= 90;

              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    {isHealthy ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">{account.email}</p>
                      <p className="text-sm text-gray-500">
                        {account.provider} • {account.totalMessagesProcessed.toLocaleString()}{' '}
                        messages
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {successRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">success rate</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {account.avgDurationMs > 0
                          ? `${(account.avgDurationMs / 1000).toFixed(1)}s`
                          : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">avg duration</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {account.lastSyncAt
                          ? new Date(account.lastSyncAt).toLocaleTimeString()
                          : 'Never'}
                      </p>
                      <p className="text-xs text-gray-500">last sync</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Failures */}
        {recentFailures.length > 0 && (
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Failures</h2>
            <div className="space-y-3">
              {recentFailures.map((failure) => (
                <div
                  key={failure.id}
                  className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                      <div>
                        <p className="font-medium">
                          {failure.subject || failure.messageId}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {failure.accountEmail} • {failure.errorType}
                        </p>
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {failure.errorMessage}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Retry: {failure.retryCount}/3</p>
                      <p>{new Date(failure.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

