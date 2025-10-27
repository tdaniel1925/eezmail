import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getOrganization,
  getOrganizationMembers,
} from '@/lib/organizations/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  MessageSquare,
  Brain,
  DollarSign,
  Settings,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OrganizationPage({
  params,
}: {
  params: { orgId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const orgResult = await getOrganization(params.orgId);
  const membersResult = await getOrganizationMembers(params.orgId);

  if (!orgResult.success || !orgResult.organization) {
    redirect('/dashboard');
  }

  const org = orgResult.organization;
  const members = membersResult.success ? membersResult.members : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {org.name}
                </h1>
                <p className="text-slate-600">/{org.slug}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href={`/dashboard/organizations/${params.orgId}/members`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Members
                </Link>
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Members
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {members?.length || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Team members</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                SMS Balance
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                ${Number(org.smsBalance || 0).toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {org.smsSentCount || 0} sent
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                AI Balance
              </CardTitle>
              <Brain className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                ${Number(org.aiBalance || 0).toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((org.aiTokensUsed || 0) / 1000)}k tokens used
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Pricing Tier
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <Badge className="text-sm">{org.pricingTier || 'standard'}</Badge>
              <p className="text-xs text-slate-500 mt-2">SMS rate tier</p>
            </CardContent>
          </Card>
        </div>

        {/* Members List */}
        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Members ({members?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members && members.length > 0 ? (
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border-2 border-slate-100"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {member.fullName || member.email}
                      </div>
                      <div className="text-sm text-slate-600">
                        {member.email}
                      </div>
                    </div>
                    <Badge>{member.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-sm">No members yet</p>
              </div>
            )}

            {members && members.length > 5 && (
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href={`/dashboard/organizations/${params.orgId}/members`}>
                  View All Members
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
