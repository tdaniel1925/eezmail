'use client';

/**
 * Ticket Statistics Cards
 * Displays key ticket metrics
 */

import { Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface TicketStatsProps {
  stats: {
    total: number;
    open: number;
    pending: number;
    urgent: number;
    breachingSLA: number;
  };
}

export function TicketStats({ stats }: TicketStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Total Tickets */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Tickets</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.total}
            </p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Open Tickets */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Open</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {stats.open}
            </p>
          </div>
          <div className="rounded-full bg-yellow-100 p-3">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {stats.pending}
            </p>
          </div>
          <div className="rounded-full bg-orange-100 p-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Urgent */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Urgent</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats.urgent}
            </p>
          </div>
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* SLA Breaches */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">SLA Breach</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats.breachingSLA}
            </p>
            <p className="text-xs text-gray-500 mt-1">Needs attention</p>
          </div>
          <div className="rounded-full bg-red-100 p-3">
            <Clock className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
