'use client';

import { Users, DollarSign, TrendingUp, TrendingDown, Mail, Search, MessageSquare } from 'lucide-react';
import type { DashboardStats } from '@/lib/admin/stats';

interface StatsOverviewProps {
  stats: DashboardStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: null,
      changeType: null,
    },
    {
      name: 'Active Subscriptions',
      value: stats.activeSubscriptions.toLocaleString(),
      icon: TrendingUp,
      change: null,
      changeType: null,
    },
    {
      name: 'Monthly Revenue',
      value: `$${stats.mrr.toLocaleString()}`,
      icon: DollarSign,
      change: null,
      changeType: null,
    },
    {
      name: 'Churn Rate',
      value: `${stats.churnRate}%`,
      icon: stats.churnRate > 5 ? TrendingDown : TrendingUp,
      change: null,
      changeType: stats.churnRate > 5 ? 'negative' : 'positive',
    },
    {
      name: 'Total Emails',
      value: stats.totalEmails.toLocaleString(),
      icon: Mail,
      change: null,
      changeType: null,
    },
    {
      name: 'RAG Searches (30d)',
      value: stats.totalRagSearches.toLocaleString(),
      icon: Search,
      change: null,
      changeType: null,
    },
    {
      name: 'AI Queries (30d)',
      value: stats.totalAiQueries.toLocaleString(),
      icon: MessageSquare,
      change: null,
      changeType: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <div
          key={stat.name}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.name}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stat.value}
              </p>
              {stat.change && (
                <p
                  className={`text-sm mt-2 flex items-center gap-1 ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {stat.change}
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <stat.icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

