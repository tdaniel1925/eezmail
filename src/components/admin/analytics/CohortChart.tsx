'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface CohortData {
  cohortMonth: string;
  usersCount: number;
  retentionMonth1: number;
  retentionMonth3: number;
  retentionMonth6: number;
  retentionMonth12: number;
  avgRevenuePerUser: number;
}

interface CohortChartProps {
  data: CohortData[];
}

export function CohortChart({ data }: CohortChartProps): JSX.Element {
  const chartData = data.map((cohort) => ({
    month: new Date(cohort.cohortMonth).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    }),
    'Month 1': cohort.retentionMonth1,
    'Month 3': cohort.retentionMonth3,
    'Month 6': cohort.retentionMonth6,
    'Month 12': cohort.retentionMonth12,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohort Retention Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="Month 1" fill="#8884d8" />
            <Bar dataKey="Month 3" fill="#82ca9d" />
            <Bar dataKey="Month 6" fill="#ffc658" />
            <Bar dataKey="Month 12" fill="#ff8042" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
