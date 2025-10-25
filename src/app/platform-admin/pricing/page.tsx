import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/admin/platform-middleware';
import { DollarSign, MessageSquare, Brain, Save, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PricingForm from '@/components/admin/PricingForm';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const admin = await requirePlatformAdmin();

  if (!admin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/platform-admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            Pricing Management
          </h1>
          <p className="text-slate-600">
            Set global rates and custom pricing for customers
          </p>
        </div>

        {/* Global Pricing */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <MessageSquare className="h-5 w-5" />
                Global SMS Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action="/api/platform-admin/pricing/sms" method="POST">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Default Rate per SMS
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        $
                      </span>
                      <input
                        type="number"
                        name="rate"
                        step="0.0001"
                        defaultValue="0.0100"
                        className="w-full pl-8 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      This rate applies to all customers without custom pricing
                    </p>
                  </div>
                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Update Global SMS Rate
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Brain className="h-5 w-5" />
                Global AI Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action="/api/platform-admin/pricing/ai" method="POST">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rate per 1,000 Tokens
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        $
                      </span>
                      <input
                        type="number"
                        name="rate"
                        step="0.000001"
                        defaultValue="0.002000"
                        className="w-full pl-8 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      This rate applies to all customers without custom pricing
                    </p>
                  </div>
                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Update Global AI Rate
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Custom Pricing */}
        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Set Custom Pricing for Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PricingForm />
          </CardContent>
        </Card>

        {/* Tier-Based Rates Info */}
        <Card className="border-2 border-slate-200 shadow-lg mt-6">
          <CardHeader>
            <CardTitle>Tier-Based SMS Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border-2 border-slate-200 p-4 text-center">
                <div className="text-sm font-medium text-slate-600 mb-2">
                  Standard
                </div>
                <div className="text-2xl font-bold text-slate-900">$0.0100</div>
                <p className="text-xs text-slate-500 mt-1">per SMS</p>
              </div>
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center">
                <div className="text-sm font-medium text-blue-600 mb-2">
                  Volume
                </div>
                <div className="text-2xl font-bold text-blue-900">$0.0085</div>
                <p className="text-xs text-blue-600 mt-1">per SMS</p>
              </div>
              <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4 text-center">
                <div className="text-sm font-medium text-purple-600 mb-2">
                  Enterprise
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  $0.0075
                </div>
                <p className="text-xs text-purple-600 mt-1">per SMS</p>
              </div>
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 text-center">
                <div className="text-sm font-medium text-green-600 mb-2">
                  Partner
                </div>
                <div className="text-2xl font-bold text-green-900">$0.0050</div>
                <p className="text-xs text-green-600 mt-1">per SMS</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-4">
              Assign tiers to customers in their profile. Custom pricing
              overrides will take priority over tier rates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

