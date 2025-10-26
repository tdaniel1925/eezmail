'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface APILatency {
  timestamp: Date;
  endpoint: string;
  duration: number;
  status: number;
}

interface APILatencyChartProps {
  data: APILatency[];
}

export function APILatencyChart({ data }: APILatencyChartProps): JSX.Element {
  // Group by minute and calculate average
  const chartData = data.reduce(
    (acc, item) => {
      const minute = new Date(item.timestamp);
      minute.setSeconds(0, 0);
      const key = minute.getTime();

      if (!acc[key]) {
        acc[key] = {
          timestamp: minute,
          durations: [],
        };
      }
      acc[key].durations.push(item.duration);
      return acc;
    },
    {} as Record<number, { timestamp: Date; durations: number[] }>
  );

  const aggregated = Object.values(chartData)
    .map(({ timestamp, durations }) => ({
      time: timestamp.toLocaleTimeString(),
      avgDuration: Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length
      ),
      maxDuration: Math.max(...durations),
    }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .slice(-60); // Last 60 minutes

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Latency Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={aggregated}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="avgDuration"
              stroke="#8884d8"
              name="Avg Duration (ms)"
            />
            <Line
              type="monotone"
              dataKey="maxDuration"
              stroke="#ff4c5a"
              name="Max Duration (ms)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
