'use client';

/**
 * Sync Dashboard
 * Comprehensive sync management UI for settings page
 */

import { useEffect, useState } from 'react';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { RefreshCw, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface EmailAccount {
  id: string;
  emailAddress: string;
  provider: string;
  syncStatus?: string;
  lastSyncAt?: Date;
}

interface SyncDashboardProps {
  userId: string;
  accounts: EmailAccount[];
}

export function SyncDashboard({
  userId,
  accounts,
}: SyncDashboardProps): JSX.Element {
  const [stats, setStats] = useState({
    total: 0,
    syncing: 0,
    errors: 0,
    idle: 0,
  });

  // Calculate stats
  useEffect(() => {
    setStats({
      total: accounts.length,
      syncing: accounts.filter((a) => a.syncStatus === 'syncing').length,
      errors: accounts.filter((a) => a.syncStatus === 'error').length,
      idle: accounts.filter((a) => !a.syncStatus || a.syncStatus === 'idle')
        .length,
    });
  }, [accounts]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={RefreshCw}
          label="Total Accounts"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="Currently Syncing"
          value={stats.syncing}
          color="yellow"
        />
        <StatCard
          icon={AlertTriangle}
          label="Sync Errors"
          value={stats.errors}
          color="red"
        />
        <StatCard
          icon={CheckCircle}
          label="Idle"
          value={stats.idle}
          color="green"
        />
      </div>

      {/* Account Sync Status List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Account Sync Status
        </h3>

        {accounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No email accounts connected</p>
            <p className="text-sm mt-1">
              Add an account to start syncing emails
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <SyncStatusIndicator
                key={account.id}
                accountId={account.id}
                accountEmail={account.emailAddress}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green:
      'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow:
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  return (
    <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
