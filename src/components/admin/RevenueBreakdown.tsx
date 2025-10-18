'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { RevenueData } from '@/lib/admin/stats';
import { format } from 'date-fns';

interface RevenueBreakdownProps {
  data: RevenueData[];
}

const COLORS = ['#FF4C5A', '#10B981', '#3B82F6', '#F59E0B'];

export function RevenueBreakdown({ data }: RevenueBreakdownProps) {
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    revenue: item.revenue,
    subscriptions: item.subscriptions,
  }));

  // Calculate tier breakdown (mock data for now - would come from API)
  const tierData = [
    { name: 'Starter', value: 45, revenue: 675 },
    { name: 'Professional', value: 35, revenue: 1225 },
    { name: 'Enterprise', value: 20, revenue: 2000 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Over Time */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Revenue Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
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
            <Bar dataKey="revenue" fill="#FF4C5A" name="Revenue ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Tier */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Revenue by Tier
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={tierData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: $${entry.revenue}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {tierData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

