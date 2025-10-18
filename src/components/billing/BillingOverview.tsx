'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BillingOverviewProps {
  userId: string;
}

interface SubscriptionData {
  tier: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  processor: string;
}

export function BillingOverview({ userId }: BillingOverviewProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, [userId]);

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const tier = subscription?.tier || 'free';
  const status = subscription?.status || 'active';
  const nextBillingDate = subscription?.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : null;

  const getTierDisplay = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getTierPrice = (tier: string) => {
    const prices: Record<string, string> = {
      free: '$0',
      starter: '$15',
      professional: '$35',
      enterprise: 'Custom',
    };
    return prices[tier] || '$0';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; text: string }> = {
      active: { color: 'text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300', icon: CheckCircle, text: 'Active' },
      trialing: { color: 'text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300', icon: TrendingUp, text: 'Trial' },
      past_due: { color: 'text-orange-700 bg-orange-100 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle, text: 'Past Due' },
      canceled: { color: 'text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300', icon: AlertCircle, text: 'Canceled' },
    };
    return badges[status] || badges.active;
  };

  const statusBadge = getStatusBadge(status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Current Subscription
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your plan and billing information
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <CreditCard className="h-4 w-4" />
              <span>Current Plan</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {getTierDisplay(tier)}
              </span>
              <span className="text-lg text-gray-500 dark:text-gray-400">
                {getTierPrice(tier)}/mo
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
            <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', statusBadge.color)}>
              <StatusIcon className="h-4 w-4" />
              {statusBadge.text}
            </div>
          </div>

          {/* Next Billing */}
          {nextBillingDate && tier !== 'free' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>Next Billing Date</span>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {nextBillingDate}
              </div>
              {subscription?.cancelAtPeriodEnd && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Subscription will end on this date
                </p>
              )}
            </div>
          )}
        </div>

        {/* Alerts */}
        {status === 'past_due' && (
          <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-orange-900 dark:text-orange-200">
                  Payment Failed
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  We couldn't process your payment. Please update your payment method to avoid service interruption.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

