'use client';

/**
 * Metric Charts Component
 * Visualize system metrics over time
 */

import { useMemo } from 'react';
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

interface MetricChartsProps {
  metrics: Array<{
    id: string;
    metric: string;
    value: number;
    timestamp: Date;
    tags?: Record<string, unknown>;
  }>;
}

export function MetricCharts({ metrics }: MetricChartsProps) {
  // Group metrics by type
  const groupedMetrics = useMemo(() => {
    const groups: Record<string, Array<{ time: string; value: number }>> = {};

    metrics.forEach((m) => {
      if (!groups[m.metric]) {
        groups[m.metric] = [];
      }
      groups[m.metric].push({
        time: format(new Date(m.timestamp), 'HH:mm'),
        value: m.value,
      });
    });

    return groups;
  }, [metrics]);

  const metricTypes = Object.keys(groupedMetrics);

  if (metricTypes.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-12 text-center">
        <p className="text-gray-500">No metrics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">System Metrics (Last Hour)</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metricTypes.slice(0, 4).map((metricType) => (
          <div key={metricType} className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium mb-4 capitalize">
              {metricType.replace(/_/g, ' ')}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={groupedMetrics[metricType].slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#FF4C5A"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {metricTypes.length > 4 && (
        <p className="text-sm text-gray-500 text-center">
          Showing 4 of {metricTypes.length} metrics
        </p>
      )}
    </div>
  );
}
