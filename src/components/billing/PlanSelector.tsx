'use client';

import { useState } from 'react';
import { Check, Zap, Crown, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PLANS, getAllPlans, type PlanId } from '@/lib/pricing/plans';

interface PlanSelectorProps {
  userId: string;
}

export function PlanSelector({ userId }: PlanSelectorProps) {
  const [isLoading, setIsLoading] = useState<PlanId | null>(null);
  const [currentTier, setCurrentTier] = useState<PlanId>('free');

  const plans = getAllPlans();

  const handleSelectPlan = async (planId: PlanId) => {
    if (planId === currentTier) return;

    setIsLoading(planId);
    try {
      const response = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.checkoutUrl) {
          // Redirect to Stripe Checkout
          window.location.href = data.checkoutUrl;
        } else {
          toast.success('Plan changed successfully!');
          setCurrentTier(planId);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to change plan');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Failed to change plan');
    } finally {
      setIsLoading(null);
    }
  };

  const getPlanIcon = (planId: PlanId) => {
    const icons = {
      free: Sparkles,
      starter: Zap,
      professional: Crown,
      enterprise: Crown,
    };
    return icons[planId];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Choose Your Plan
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Upgrade or downgrade your subscription at any time
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.id as PlanId);
          const isCurrent = plan.id === currentTier;
          const loading = isLoading === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                'relative bg-white dark:bg-gray-800 rounded-xl border-2 shadow-sm overflow-hidden transition-all',
                plan.highlighted
                  ? 'border-primary shadow-primary/20'
                  : 'border-gray-200 dark:border-gray-700',
                isCurrent && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}

              <div className="p-6">
                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center',
                    plan.highlighted ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-700'
                  )}>
                    <Icon className={cn(
                      'h-6 w-6',
                      plan.highlighted ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
                    )} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Current Plan
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {plan.price === null ? (
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      Custom
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${plan.price}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">/month</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                {plan.id === 'enterprise' ? (
                  <a
                    href="mailto:sales@yourcompany.com"
                    className="block w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Contact Sales
                  </a>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.id as PlanId)}
                    disabled={isCurrent || loading}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
                      plan.highlighted
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : currentTier === 'free' || plans.findIndex(p => p.id === plan.id) > plans.findIndex(p => p.id === currentTier) ? (
                      'Upgrade'
                    ) : (
                      'Downgrade'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guarantee */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          ✨ All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

