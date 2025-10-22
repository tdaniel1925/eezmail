'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  inverse?: boolean; // For metrics where lower is better (e.g., response time)
}

const colorClasses = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  green: 'bg-green-500/10 text-green-600 dark:text-green-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  inverse = false,
}: StatsCardProps) {
  const hasChange = change !== undefined && change !== 0;
  const isPositive = inverse ? change! < 0 : change! > 0;
  const isNegative = inverse ? change! > 0 : change! < 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
          {hasChange && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && <TrendingUp className="h-4 w-4 text-green-500" />}
              {isNegative && <TrendingDown className="h-4 w-4 text-red-500" />}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive && 'text-green-600 dark:text-green-400',
                  isNegative && 'text-red-600 dark:text-red-400'
                )}
              >
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                vs last period
              </span>
            </div>
          )}
        </div>
        <div className={cn('rounded-full p-3', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
