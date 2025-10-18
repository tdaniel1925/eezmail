'use client';

import { getAllPlans } from '@/lib/pricing/plans';
import { Edit, Check } from 'lucide-react';

export function PricingManager() {
  const plans = getAllPlans();

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          💡 <strong>Note:</strong> Pricing configuration is managed in <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">src/lib/pricing/plans.ts</code>. 
          Stripe products should match these tiers. Create products in your <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="underline font-medium">Stripe Dashboard</a>.
        </p>
      </div>

      {/* Plans Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              {plan.highlighted && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">
                  POPULAR
                </span>
              )}
            </div>

            <div className="mb-4">
              {plan.price === null ? (
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  Custom
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">/mo</span>
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {plan.description}
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                Key Limits
              </p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  {plan.limits.emailAccounts === -1 ? 'Unlimited' : plan.limits.emailAccounts} accounts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  {plan.limits.emailsStored === -1 ? 'Unlimited' : `${plan.limits.emailsStored.toLocaleString()}`} emails
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  {plan.limits.ragSearchesPerDay === -1 ? 'Unlimited' : plan.limits.ragSearchesPerDay} RAG/day
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  {plan.limits.aiQueriesPerMonth === -1 ? 'Unlimited' : plan.limits.aiQueriesPerMonth} AI/mo
                </li>
              </ul>
            </div>

            {plan.stripePriceId ? (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Stripe Price ID:
                </p>
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block mt-1 truncate">
                  {plan.stripePriceId || 'Not configured'}
                </code>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  ⚠️ Stripe price not configured
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Configuration Instructions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          How to Configure Pricing
        </h3>
        <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              1
            </span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Create Products in Stripe</p>
              <p>Go to <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="text-primary underline">Stripe Dashboard</a> and create products for each tier</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              2
            </span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Add Price IDs to Environment</p>
              <p>Copy the price IDs and add them to your <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">.env.local</code> file</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              3
            </span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Update plans.ts</p>
              <p>The price IDs will be automatically loaded from environment variables in <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">src/lib/pricing/plans.ts</code></p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              4
            </span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Test Checkout Flow</p>
              <p>Use Stripe test mode to verify the complete upgrade/downgrade flow works correctly</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}

