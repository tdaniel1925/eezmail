import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/admin/platform-middleware';
import { Gift, ArrowLeft, MessageSquare, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import TrialCreditsForm from '@/components/admin/TrialCreditsForm';

export const dynamic = 'force-dynamic';

export default async function TrialsPage() {
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
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/10 p-3">
              <Gift className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Trial Credits Management
              </h1>
              <p className="text-slate-600">
                Grant free SMS and AI credits to customers
              </p>
            </div>
          </div>
        </div>

        {/* Default Trial Info */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="border-2 border-blue-200 bg-blue-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <MessageSquare className="h-5 w-5" />
                Default SMS Trial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 mb-2">
                $5.00
              </div>
              <p className="text-sm text-blue-700">
                ~500 SMS messages at standard rate
              </p>
              <p className="text-xs text-blue-600 mt-2">Duration: 30 days</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Brain className="h-5 w-5" />
                Default AI Trial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 mb-2">
                $10.00
              </div>
              <p className="text-sm text-purple-700">
                ~5,000 tokens (200+ AI requests)
              </p>
              <p className="text-xs text-purple-600 mt-2">Duration: 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Grant Trial Credits Form */}
        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              Grant Trial Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrialCreditsForm />
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-2 border-slate-200 shadow-lg mt-6">
          <CardHeader>
            <CardTitle>How Trial Credits Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Priority</h3>
              <p className="text-sm text-slate-600">
                Trial credits are used <strong>before</strong> subscription
                included SMS/tokens and <strong>before</strong> paid balance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Expiration</h3>
              <p className="text-sm text-slate-600">
                Trial credits automatically expire after the specified duration.
                Expired credits cannot be used.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Tracking</h3>
              <p className="text-sm text-slate-600">
                All trial credit usage is tracked in the customer's timeline and
                usage analytics.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Best Practices</h3>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                <li>Grant trials to new customers during onboarding</li>
                <li>Use generous trials for enterprise prospects</li>
                <li>Document reason for each trial grant</li>
                <li>Monitor trial usage to prevent abuse</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

