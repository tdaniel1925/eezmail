'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { SubscriptionStat } from '@/lib/admin/stats';

// Dynamically import recharts to avoid SSR hydration issues
const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), {
  ssr: false,
});
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), {
  ssr: false,
});
const Legend = dynamic(() => import('recharts').then((mod) => mod.Legend), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

interface SubscriptionChartProps {
  stats: SubscriptionStat[];
}

export function SubscriptionChart({ stats }: SubscriptionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = stats.map((stat) => ({
    tier: stat.tier.charAt(0).toUpperCase() + stat.tier.slice(1),
    count: stat.count,
    percentage: stat.percentage,
  }));

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Subscription Distribution
        </h3>
        <div className="h-[300px] flex items-center justify-center text-gray-400">
          Loading chart...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Subscription Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-gray-200 dark:stroke-gray-700"
          />
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
