'use client';

import { CreditCard, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User as UserType, Subscription } from '@/db/schema';

interface BillingSettingsProps {
  user: UserType;
  subscription: Subscription | null;
}

export function BillingSettings({
  user,
  subscription,
}: BillingSettingsProps): JSX.Element {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '/month',
      features: [
        '1 email account',
        'Basic AI features',
        'Email screening',
        '10 GB storage',
        'Standard support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$12',
      period: '/month',
      popular: true,
      features: [
        '5 email accounts',
        'Advanced AI features',
        'Priority screening',
        '100 GB storage',
        'Smart replies',
        'Priority support',
        'Custom signatures',
      ],
    },
    {
      id: 'team',
      name: 'Team',
      price: '$29',
      period: '/month',
      features: [
        '15 email accounts',
        'Team collaboration',
        'All Pro features',
        '500 GB storage',
        'Shared templates',
        'Admin controls',
        'Dedicated support',
      ],
    },
  ];

  const currentPlan =
    plans.find((p) => p.id === user.subscriptionTier) || plans[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Billing & Subscription
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
        <div className="mb-4 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-gray-700 dark:text-white/70" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Current Plan
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentPlan.name}
              </span>
              {currentPlan.popular && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                  Popular
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
              {subscription?.status === 'active'
                ? 'Active subscription'
                : 'Free plan'}
            </p>
            {subscription && (
              <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
                Renews on{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>

          {user.subscriptionTier !== 'free' && subscription && (
            <Button variant="secondary" size="sm">
              Manage Subscription
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {currentPlan.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-white/80">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Available Plans */}
      {user.subscriptionTier === 'free' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upgrade Your Plan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans
              .filter((plan) => plan.id !== 'free')
              .map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-lg border-2 p-6 ${
                    plan.popular
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5'
                  } backdrop-blur-md`}
                >
                  {plan.popular && (
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </h4>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-white/60">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-white/80">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? 'primary' : 'secondary'}
                    className="w-full"
                  >
                    Upgrade to {plan.name}
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Payment Method */}
      {subscription && (
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Payment Method
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 dark:bg-white/10">
                <CreditCard className="h-5 w-5 text-gray-700 dark:text-white/70" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {subscription.processor === 'stripe' ? 'Stripe' : 'Square'}
                </div>
                <div className="text-xs text-gray-600 dark:text-white/60">
                  Payment processor
                </div>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Update
            </Button>
          </div>
        </div>
      )}

      {/* Billing History */}
      {subscription && (
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Billing History
          </h3>

          <div className="text-center py-8 text-gray-600 dark:text-white/60">
            <p className="text-sm">Your billing history will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
}


