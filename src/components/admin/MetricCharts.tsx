'use client';

/**
 * Metric Charts Component
 * Visualize system metrics over time
 */

import { useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';

// Dynamically import recharts to avoid SSR issues
const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  {
    ssr: false,
  }
);
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), {
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-12 text-center">
        <p className="text-gray-400">No metrics data available</p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-white">
          System Metrics (Last Hour)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {metricTypes.slice(0, 4).map((metricType) => (
            <div
              key={metricType}
              className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6"
            >
              <h3 className="text-sm font-medium mb-4 capitalize text-white">
                {metricType.replace(/_/g, ' ')}
              </h3>
              <div className="h-[200px] flex items-center justify-center text-gray-400">
                Loading chart...
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">
        System Metrics (Last Hour)
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metricTypes.slice(0, 4).map((metricType) => (
          <div
            key={metricType}
            className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6"
          >
            <h3 className="text-sm font-medium mb-4 capitalize text-white">
              {metricType.replace(/_/g, ' ')}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={groupedMetrics[metricType].slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  stroke="#475569"
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  stroke="#475569"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name={metricType}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {metricTypes.length > 4 && (
        <p className="text-sm text-gray-400 text-center">
          Showing 4 of {metricTypes.length} metrics
        </p>
      )}
    </div>
  );
}
