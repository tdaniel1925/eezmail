'use client';

import useSWR from 'swr';

export interface EmailAnalytics {
  totalReceived: number;
  totalSent: number;
  avgResponseTime: number;
  activeContacts: number;
  receiveGrowth: number;
  sendGrowth: number;
  responseTimeChange: number;
  contactsGrowth: number;
  volumeByDay: Array<{ date: string; received: number; sent: number }>;
  responseTimeDistribution: Array<{ range: string; count: number }>;
  topSenders: Array<{
    email: string;
    name: string;
    count: number;
    avgResponseTime: number;
  }>;
  emailsByHourOfDay: Array<{ hour: number; day: string; count: number }>;
  aiImpact?: {
    timeSavedMinutes: number;
    actionsPerformed: number;
    emailsCategorized: number;
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch analytics');
  }
  return res.json();
};

export function useAnalytics(period: '7d' | '30d' | '90d' = '30d') {
  const { data, error, isLoading, mutate } = useSWR<EmailAnalytics>(
    `/api/analytics/summary?period=${period}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    analytics: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
