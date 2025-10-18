'use client';

import { useState, useEffect } from 'react';
import { Search, Mail, MessageSquare, Database, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getPlan, getLimit, formatLimit, type PlanId } from '@/lib/pricing/plans';

interface UsageDashboardProps {
  userId: string;
}

interface UsageData {
  ragSearches: number;
  aiQueries: number;
  emailsStored: number;
  tier: PlanId;
}

export function UsageDashboard({ userId }: UsageDashboardProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, [userId]);

  const loadUsage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Error loading usage:', error);
      toast.error('Failed to load usage data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const plan = getPlan(usage.tier);
  
  const usageItems = [
    {
      label: 'RAG Searches',
      icon: Search,
      current: usage.ragSearches,
      limit: getLimit(usage.tier, 'ragSearchesPerDay'),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'AI Queries',
      icon: MessageSquare,
      current: usage.aiQueries,
      limit: getLimit(usage.tier, 'aiQueriesPerMonth'),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      label: 'Emails Stored',
      icon: Mail,
      current: usage.emailsStored,
      limit: getLimit(usage.tier, 'emailsStored'),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
  ];

  const calculatePercentage = (current: number, limit: number): number => {
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, Math.round((current / limit) * 100));
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Usage This Month
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track your resource consumption
            </p>
          </div>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Usage Items */}
      <div className="p-6 space-y-6">
        {usageItems.map((item) => {
          const Icon = item.icon;
          const percentage = calculatePercentage(item.current, item.limit);
          const isUnlimited = item.limit === -1;
          const isNearLimit = percentage >= 80;

          return (
            <div key={item.label} className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', item.bgColor)}>
                    <Icon className={cn('h-5 w-5', item.color)} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isUnlimited ? 'Unlimited' : `${formatLimit(item.limit)} per ${item.label === 'RAG Searches' ? 'day' : 'month'}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.current.toLocaleString()}
                  </p>
                  {!isUnlimited && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      of {formatLimit(item.limit)}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {!isUnlimited && (
                <>
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full transition-all duration-500', getProgressColor(percentage))}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {/* Warning */}
                  {isNearLimit && (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                          Approaching Limit
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                          You've used {percentage}% of your {item.label.toLowerCase()} limit. Consider upgrading to avoid service interruption.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {usage.tier === 'free' && (
        <div className="px-6 py-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Need more resources?
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Upgrade to unlock higher limits and premium features
              </p>
            </div>
            <a
              href="#plans"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap"
            >
              View Plans
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

