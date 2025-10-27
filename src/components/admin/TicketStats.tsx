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
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Total Tickets</p>
            <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
          </div>
          <div className="rounded-full bg-blue-500/10 p-3 border border-blue-500/20">
            <Activity className="h-6 w-6 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Open Tickets */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Open</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">
              {stats.open}
            </p>
          </div>
          <div className="rounded-full bg-yellow-500/10 p-3 border border-yellow-500/20">
            <Clock className="h-6 w-6 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Pending</p>
            <p className="text-3xl font-bold text-orange-400 mt-2">
              {stats.pending}
            </p>
          </div>
          <div className="rounded-full bg-orange-500/10 p-3 border border-orange-500/20">
            <AlertTriangle className="h-6 w-6 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Urgent */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Urgent</p>
            <p className="text-3xl font-bold text-red-400 mt-2">
              {stats.urgent}
            </p>
          </div>
          <div className="rounded-full bg-red-500/10 p-3 border border-red-500/20">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
        </div>
      </div>

      {/* SLA Breaches */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">SLA Breach</p>
            <p className="text-3xl font-bold text-red-400 mt-2">
              {stats.breachingSLA}
            </p>
            <p className="text-xs text-gray-400 mt-1">Needs attention</p>
          </div>
          <div className="rounded-full bg-red-500/10 p-3 border border-red-500/20">
            <Clock className="h-6 w-6 text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
