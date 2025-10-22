'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface EmailVolumeChartProps {
  data: Array<{ date: string; received: number; sent: number }>;
  period: '7d' | '30d' | '90d';
}

export function EmailVolumeChart({ data, period }: EmailVolumeChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Email Volume
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(new Date(value), 'MMM dd')}
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB',
            }}
            labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="received"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Received"
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="sent"
            stroke="#10B981"
            strokeWidth={2}
            name="Sent"
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
