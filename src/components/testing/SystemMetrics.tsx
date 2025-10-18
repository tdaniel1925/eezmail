'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Database,
  Cpu,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricData {
  label: string;
  value: string | number;
  change?: number; // percentage change
  trend?: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: string;
  description?: string;
}

interface SystemMetricsProps {
  className?: string;
}

export function SystemMetrics({ className }: SystemMetricsProps) {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);

        // Load metrics from localStorage or API
        const storedMetrics = localStorage.getItem('system-metrics');
        if (storedMetrics) {
          const parsed = JSON.parse(storedMetrics);
          setMetrics(parsed);
        } else {
          // Default metrics if none stored
          setMetrics([
            {
              label: 'Active Users',
              value: '0',
              change: 0,
              trend: 'stable',
              icon: Users,
              color: 'text-blue-600',
              description: 'Users currently online',
            },
            {
              label: 'Total Emails',
              value: '0',
              change: 0,
              trend: 'stable',
              icon: Mail,
              color: 'text-green-600',
              description: 'Emails in database',
            },
            {
              label: 'Database Health',
              value: '0%',
              change: 0,
              trend: 'stable',
              icon: Database,
              color: 'text-purple-600',
              description: 'Database performance score',
            },
            {
              label: 'Memory Usage',
              value: '0%',
              change: 0,
              trend: 'stable',
              icon: Cpu,
              color: 'text-orange-600',
              description: 'System memory usage',
            },
            {
              label: 'Error Rate',
              value: '0%',
              change: 0,
              trend: 'stable',
              icon: AlertTriangle,
              color: 'text-red-600',
              description: 'Application error rate',
            },
            {
              label: 'Sync Status',
              value: 'Idle',
              change: 0,
              trend: 'stable',
              icon: Activity,
              color: 'text-indigo-600',
              description: 'Email sync status',
            },
          ]);
        }
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();

    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string, change: number) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <metric.icon className={cn('h-4 w-4', metric.color)} />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.label}
              </span>
            </div>
            {metric.change !== undefined && metric.change !== 0 && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs',
                  getTrendColor(metric.trend || 'stable', metric.change)
                )}
              >
                {getTrendIcon(metric.trend || 'stable')}
                <span>{Math.abs(metric.change)}%</span>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </span>
          </div>

          {/* Description */}
          {metric.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {metric.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
