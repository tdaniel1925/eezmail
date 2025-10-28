import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageSquare,
  Target,
  BarChart3,
  Mail,
  Settings,
  TrendingUp,
} from 'lucide-react';

export default async function BetaDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // TODO: Add proper admin role check

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Beta Testing Hub</h1>
        <p className="text-muted-foreground">
          Manage your beta program, collect feedback, and generate insights
        </p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <BetaStats />
      </Suspense>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Beta Users"
          description="Invite and manage beta testers"
          icon={<Users className="h-6 w-6" />}
          href="/admin/beta/users"
          stats="Manage testers"
        />

        <DashboardCard
          title="Feedback"
          description="View and organize user feedback"
          icon={<MessageSquare className="h-6 w-6" />}
          href="/admin/beta/feedback"
          stats="Review submissions"
        />

        <DashboardCard
          title="AI Insights"
          description="AI-generated action items and trends"
          icon={<Target className="h-6 w-6" />}
          href="/admin/beta/insights"
          stats="View insights"
        />

        <DashboardCard
          title="Analytics"
          description="Usage stats and engagement metrics"
          icon={<BarChart3 className="h-6 w-6" />}
          href="/admin/beta/analytics"
          stats="View charts"
        />

        <DashboardCard
          title="Email Management"
          description="Templates and delivery tracking"
          icon={<Mail className="h-6 w-6" />}
          href="/admin/beta/emails"
          stats="Manage emails"
        />

        <DashboardCard
          title="Settings"
          description="Configure beta program settings"
          icon={<Settings className="h-6 w-6" />}
          href="/admin/beta/settings"
          stats="Configure"
        />
      </div>
    </div>
  );
}

async function BetaStats() {
  // TODO: Fetch actual stats from database
  const stats = {
    totalUsers: 0,
    activeUsers: 0,
    feedbackCount: 0,
    actionItems: 0,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Beta Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="inline h-3 w-3" /> Active testers
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Feedback Received</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.feedbackCount}</div>
          <p className="text-xs text-muted-foreground">Total submissions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Action Items</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.actionItems}</div>
          <p className="text-xs text-muted-foreground">AI-generated tasks</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalUsers > 0
              ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
              : 0}
            %
          </div>
          <p className="text-xs text-muted-foreground">Active users</p>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  icon,
  href,
  stats,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  stats: string;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Link href={href}>
          <Button className="w-full">{stats}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

