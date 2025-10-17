'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Users, Zap, Loader2 } from 'lucide-react';
import type { Email } from '@/db/schema';

interface EmailAnalyticsProps {
  email: Email | null;
}

interface Analytics {
  senderEmailCount?: number;
  avgResponseTime?: string;
  threadParticipants?: number;
  priorityScore?: number;
}

export function EmailAnalytics({ email }: EmailAnalyticsProps): JSX.Element {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setAnalytics(null);
      return;
    }

    // Simulated analytics - in real app, fetch from API
    const fetchAnalytics = async () => {
      setIsLoading(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setAnalytics({
        senderEmailCount: Math.floor(Math.random() * 50) + 1,
        avgResponseTime: '4 hours',
        threadParticipants: Math.floor(Math.random() * 5) + 1,
        priorityScore: Math.floor(Math.random() * 10) + 1,
      });

      setIsLoading(false);
    };

    fetchAnalytics();
  }, [email?.id]);

  if (!email) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Select an email to see analytics
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-2 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Email Analytics
      </h3>

      <div className="space-y-2">
        <AnalyticItem
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          label="Emails from sender"
          value={`${analytics.senderEmailCount} this month`}
        />
        <AnalyticItem
          icon={<Clock className="h-4 w-4 text-green-500" />}
          label="Avg response time"
          value={analytics.avgResponseTime}
        />
        <AnalyticItem
          icon={<Users className="h-4 w-4 text-purple-500" />}
          label="Thread participants"
          value={analytics.threadParticipants.toString()}
        />
        <AnalyticItem
          icon={<Zap className="h-4 w-4 text-yellow-500" />}
          label="Priority score"
          value={`${analytics.priorityScore}/10`}
        />
      </div>
    </div>
  );
}

interface AnalyticItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function AnalyticItem({ icon, label, value }: AnalyticItemProps): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}
        </span>
      </div>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}
