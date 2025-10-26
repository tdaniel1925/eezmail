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
import { DollarSign } from 'lucide-react';

interface RevenueAttribution {
  featureName: string;
  totalRevenue: number;
  userCount: number;
  avgRevenuePerUser: number;
}

interface RevenueAttributionProps {
  data: RevenueAttribution[];
}

export function RevenueAttribution({
  data,
}: RevenueAttributionProps): JSX.Element {
  const chartData = data.map((item) => ({
    feature: item.featureName.replace(/_/g, ' '),
    revenue: item.totalRevenue,
    users: item.userCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Revenue Attribution by Feature
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No revenue attribution data available
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 space-y-4">
              <h4 className="font-medium">Top Revenue Drivers</h4>
              <div className="space-y-2">
                {data.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {item.featureName.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.userCount} users
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ${item.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${item.avgRevenuePerUser.toFixed(2)}/user
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
