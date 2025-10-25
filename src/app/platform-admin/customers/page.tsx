import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/admin/platform-middleware';
import { getAllCustomers } from '@/lib/admin/platform-actions';
import {
  Building2,
  User,
  DollarSign,
  MessageSquare,
  Brain,
  AlertCircle,
  Gift,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const admin = await requirePlatformAdmin();

  if (!admin) {
    redirect('/dashboard');
  }

  const customersResult = await getAllCustomers();
  const customers = customersResult.success ? customersResult.customers : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/platform-admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Customer Management
              </h1>
              <p className="text-slate-600">
                Manage all organizations and individual accounts
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {customers?.length || 0}
              </div>
              <p className="text-sm text-slate-600">Total Customers</p>
            </div>
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid gap-6">
          {customers && customers.length > 0 ? (
            customers.map((customer) => (
              <Card
                key={customer.id}
                className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`rounded-lg p-3 ${
                          customer.type === 'organization'
                            ? 'bg-blue-100'
                            : 'bg-purple-100'
                        }`}
                      >
                        {customer.type === 'organization' ? (
                          <Building2
                            className={`h-6 w-6 ${
                              customer.type === 'organization'
                                ? 'text-blue-600'
                                : 'text-purple-600'
                            }`}
                          />
                        ) : (
                          <User className="h-6 w-6 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">
                            {customer.name}
                          </CardTitle>
                          <Badge
                            variant={
                              customer.type === 'organization'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {customer.type}
                          </Badge>
                          {customer.isTrial && (
                            <Badge
                              variant="outline"
                              className="border-amber-500 text-amber-700"
                            >
                              <Gift className="h-3 w-3 mr-1" />
                              Trial
                            </Badge>
                          )}
                        </div>
                        {customer.email && (
                          <p className="text-sm text-slate-600">
                            {customer.email}
                          </p>
                        )}
                        <p className="text-xs text-slate-500">
                          Joined{' '}
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/platform-admin/customers/${customer.id}`}>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* SMS Balance */}
                    <div className="rounded-lg border-2 border-slate-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-slate-600">
                          SMS Balance
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        ${customer.smsBalance.toFixed(2)}
                      </div>
                      <p className="text-xs text-slate-500">
                        {customer.smsSentCount} sent
                      </p>
                    </div>

                    {/* AI Balance */}
                    <div className="rounded-lg border-2 border-slate-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-slate-600">
                          AI Balance
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        ${customer.aiBalance.toFixed(2)}
                      </div>
                      <p className="text-xs text-slate-500">
                        {Math.round(customer.aiTokensUsed / 1000)}k tokens used
                      </p>
                    </div>

                    {/* Total Usage */}
                    <div className="rounded-lg border-2 border-slate-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-slate-600">
                          Total Spent
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        $
                        {(
                          customer.smsSentCount * 0.01 +
                          (customer.aiTokensUsed / 1000) * 0.002
                        ).toFixed(2)}
                      </div>
                      <p className="text-xs text-slate-500">Estimated</p>
                    </div>

                    {/* Trial Status */}
                    {customer.isTrial && customer.trialExpiresAt && (
                      <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-xs font-medium text-amber-800">
                            Trial Expires
                          </span>
                        </div>
                        <div className="text-lg font-bold text-amber-900">
                          {Math.ceil(
                            (new Date(customer.trialExpiresAt).getTime() -
                              Date.now()) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          days
                        </div>
                        <p className="text-xs text-amber-700">
                          {new Date(customer.trialExpiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-2 border-slate-200 shadow-lg">
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No customers yet
                </h3>
                <p className="text-slate-600">
                  Customers will appear here once they sign up
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

