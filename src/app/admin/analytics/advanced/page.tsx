import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getCohortAnalysis,
  getChurnPredictions,
  getRevenueAttribution,
  getEngagementSummary,
} from '@/lib/analytics/cohort-analysis';
import { CohortChart } from '@/components/admin/analytics/CohortChart';
import { ChurnPrediction } from '@/components/admin/analytics/ChurnPrediction';
import { RevenueAttribution } from '@/components/admin/analytics/RevenueAttribution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, DollarSign, TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'Advanced Analytics - Admin',
  description: 'Deep dive into user behavior and business metrics',
};

async function AnalyticsContent(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch analytics data
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

  const cohortData = await getCohortAnalysis({ limit: 12 });
  const churnPredictions = await getChurnPredictions({
    riskLevel: 'high',
    limit: 10,
  });
  const revenueData = await getRevenueAttribution({
    startMonth: startDate,
  });
  const engagement = await getEngagementSummary({ startDate });

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagement.totalUsers.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagement.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {engagement.totalUsers > 0
                ? Math.round(
                    (engagement.activeUsers / engagement.totalUsers) * 100
                  )
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagement.totalEvents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {engagement.avgEventsPerUser.toFixed(1)} avg/user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Feature</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {engagement.topFeatures[0]?.feature.replace(/_/g, ' ') || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {engagement.topFeatures[0]?.count.toLocaleString() || 0} events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      <CohortChart data={cohortData} />

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Attribution */}
        <RevenueAttribution data={revenueData} />

        {/* Top Features */}
        <Card>
          <CardHeader>
            <CardTitle>Most Used Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagement.topFeatures.slice(0, 10).map((feature, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">
                        {feature.feature.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {feature.count.toLocaleString()} events
                      </div>
                    </div>
                  </div>
                  <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(feature.count / engagement.topFeatures[0].count) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Churn Predictions */}
      <ChurnPrediction predictions={churnPredictions} />
    </div>
  );
}

export default async function AdvancedAnalyticsPage(): Promise<JSX.Element> {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <p className="text-muted-foreground">
          Deep dive into user behavior, cohorts, and revenue metrics
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
