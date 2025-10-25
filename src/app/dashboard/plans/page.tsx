import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { subscriptionPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import PlanCard from '@/components/billing/PlanCard';
import { Check } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get all active plans
  const plans = await db.query.subscriptionPlans.findMany({
    where: eq(subscriptionPlans.isActive, true),
    orderBy: (plans, { asc }) => [asc(plans.monthlyPrice)],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select the perfect plan for your needs. All plans include SMS + AI credits.
            Upgrade or cancel anytime.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="rounded-lg border-2 border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                What happens when I exceed my included SMS/AI credits?
              </h3>
              <p className="text-slate-600">
                You'll automatically be charged at your plan's overage rate. No service interruption.
              </p>
            </div>
            <div className="rounded-lg border-2 border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-slate-600">
                Yes! Cancel anytime from your billing page. You'll retain access until the end of your billing period.
              </p>
            </div>
            <div className="rounded-lg border-2 border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                Do unused credits roll over?
              </h3>
              <p className="text-slate-600">
                No, included SMS/AI credits reset monthly. Consider top-up credits if you need a balance that doesn't expire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

