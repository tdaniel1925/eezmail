'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RevenueData } from '@/lib/admin/stats';
import { format } from 'date-fns';

interface RevenueChartProps {
  data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    revenue: item.revenue,
    subscriptions: item.subscriptions,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Revenue Trend (Last 30 Days)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="date" 
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
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#FF4C5A" 
            strokeWidth={2}
            name="Revenue ($)" 
          />
          <Line 
            type="monotone" 
            dataKey="subscriptions" 
            stroke="#10B981" 
            strokeWidth={2}
            name="New Subscriptions" 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

