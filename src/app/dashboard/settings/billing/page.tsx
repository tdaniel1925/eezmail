import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BillingOverview } from '@/components/billing/BillingOverview';
import { PlanSelector } from '@/components/billing/PlanSelector';
import { UsageDashboard } from '@/components/billing/UsageDashboard';

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Billing & Subscription
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Billing Overview */}
        <BillingOverview userId={user.id} />

        {/* Usage Dashboard */}
        <UsageDashboard userId={user.id} />

        {/* Plan Selector */}
        <PlanSelector userId={user.id} />
      </div>
    </div>
  );
}

