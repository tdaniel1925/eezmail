'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SubscriptionStat } from '@/lib/admin/stats';

interface SubscriptionChartProps {
  stats: SubscriptionStat[];
}

export function SubscriptionChart({ stats }: SubscriptionChartProps) {
  const data = stats.map((stat) => ({
    tier: stat.tier.charAt(0).toUpperCase() + stat.tier.slice(1),
    count: stat.count,
    percentage: stat.percentage,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Subscription Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="tier" 
            className="text-xs text-gray-600 dark:text-gray-400"
          />
          <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="count" fill="#FF4C5A" name="Subscribers" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

