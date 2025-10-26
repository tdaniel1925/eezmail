'use client';

/**
 * Email Account Statistics Cards
 */

import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface EmailAccountStatsProps {
  stats: {
    total: number;
    active: number;
    errors: number;
    syncing: number;
  };
}

export function EmailAccountStats({ stats }: EmailAccountStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Accounts */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Accounts</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.total}
            </p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Active */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.active}
            </p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Errors */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Errors</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats.errors}
            </p>
          </div>
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Syncing */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Syncing Now</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats.syncing}
            </p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <Loader className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );
}
