'use client';

import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';
import type { DashboardStats } from '@/lib/admin/stats';

interface SalesMetricsProps {
  stats: DashboardStats;
}

export function SalesMetrics({ stats }: SalesMetricsProps) {
  const metrics = [
    {
      label: 'Monthly Recurring Revenue',
      value: `$${stats.mrr.toLocaleString()}`,
      icon: DollarSign,
      change: '+12.5%',
      changeType: 'positive' as const,
    },
    {
      label: 'Annual Recurring Revenue',
      value: `$${(stats.mrr * 12).toLocaleString()}`,
      icon: TrendingUp,
      change: '+18.2%',
      changeType: 'positive' as const,
    },
    {
      label: 'Active Subscriptions',
      value: stats.activeSubscriptions.toLocaleString(),
      icon: Users,
      change: '+8 this month',
      changeType: 'positive' as const,
    },
    {
      label: 'Churn Rate',
      value: `${stats.churnRate}%`,
      icon: CreditCard,
      change: stats.churnRate > 5 ? 'Above target' : 'On target',
      changeType: stats.churnRate > 5 ? ('negative' as const) : ('positive' as const),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <metric.icon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {metric.label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {metric.value}
          </p>
          <p
            className={`text-sm ${
              metric.changeType === 'positive'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {metric.change}
          </p>
        </div>
      ))}
    </div>
  );
}

