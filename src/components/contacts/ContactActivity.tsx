'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface ActivityStats {
  totalEmails: number;
  emailsSent: number;
  emailsReceived: number;
  averageResponseTime: number; // in hours
  lastContactDate: Date | null;
  firstContactDate: Date | null;
  monthlyActivity: { month: string; year: number; sent: number; received: number }[];
}

interface ContactActivityProps {
  contactId: string;
}

export function ContactActivity({
  contactId,
}: ContactActivityProps): JSX.Element {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load activity stats from API
  useEffect(() => {
    loadActivityStats();
  }, [contactId]);

  const loadActivityStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/activity`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity stats');
      }
      const data = await response.json();
      if (data.success && data.stats) {
        setStats({
          ...data.stats,
          lastContactDate: data.stats.lastContactDate
            ? new Date(data.stats.lastContactDate)
            : null,
          firstContactDate: data.stats.firstContactDate
            ? new Date(data.stats.firstContactDate)
            : null,
        });
      } else {
        toast.error('Failed to load activity stats');
      }
    } catch (error) {
      console.error('Error loading activity stats:', error);
      toast.error('Failed to load activity stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No activity data available
        </p>
      </div>
    );
  }

  const maxEmails = Math.max(
    ...stats.monthlyActivity.map((m) => Math.max(m.sent, m.received))
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Mail className="h-4 w-4" />
            <span className="text-xs font-medium">Total Emails</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalEmails}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Send className="h-4 w-4" />
            <span className="text-xs font-medium">Sent</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.emailsSent}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Received</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.emailsReceived}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Avg Response</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.averageResponseTime}h
          </p>
        </div>
      </div>

      {/* Contact History */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Contact History
        </h3>
        <div className="space-y-2 text-sm">
          {stats.firstContactDate && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                First contact:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.firstContactDate.toLocaleDateString()}
              </span>
            </div>
          )}
          {stats.lastContactDate && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Last contact:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.lastContactDate.toLocaleDateString()}
              </span>
            </div>
          )}
          {stats.firstContactDate && stats.lastContactDate && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Relationship duration:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.floor(
                  (stats.lastContactDate.getTime() -
                    stats.firstContactDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                days
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Activity Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Monthly Activity
          </h3>
        </div>

        <div className="space-y-4">
          {stats.monthlyActivity.map((month, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {month.month}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {month.sent + month.received} total
                </span>
              </div>
              <div className="space-y-1">
                {/* Sent bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-16">
                    Sent ({month.sent})
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(month.sent / maxEmails) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
                {/* Received bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-16">
                    Recv ({month.received})
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(month.received / maxEmails) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Pattern */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Response Pattern
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Response rate:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.round((stats.emailsReceived / stats.emailsSent) * 100)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Avg response time:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {stats.averageResponseTime} hours
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Communication style:
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Responsive
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
