'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface Execution {
  id: string;
  ruleId: string;
  ruleName: string;
  emailId: string;
  emailSubject: string;
  emailFrom: string;
  action: string;
  success: boolean;
  userCorrection?: string;
  executedAt: string;
}

export function ExecutionHistory() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/autopilot/history?page=${page}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions || []);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('move')) return '📁';
    if (action.includes('label')) return '🏷️';
    if (action.includes('archive')) return '📦';
    if (action.includes('delete')) return '🗑️';
    if (action.includes('forward')) return '📧';
    return '⚡';
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading execution history...
        </p>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          No executions yet
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your automation rules haven't run yet. They'll show up here when they do.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {executions.map((execution) => (
        <Card
          key={execution.id}
          className="p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-4">
            {/* Status Icon */}
            <div className="mt-1">
              {execution.success ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Rule Name */}
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                  {execution.ruleName}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(execution.executedAt)}
                </span>
              </div>

              {/* Email Info */}
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {execution.emailSubject}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    From: {execution.emailFrom}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-base">{getActionIcon(execution.action)}</span>
                <ArrowRight className="h-3 w-3" />
                <span>{execution.action}</span>
              </div>

              {/* User Correction */}
              {execution.userCorrection && (
                <div className="mt-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-2">
                  <p className="text-xs text-yellow-800 dark:text-yellow-400">
                    <strong>User corrected:</strong> {execution.userCorrection}
                  </p>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0">
              {execution.success ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Success
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  Failed
                </Badge>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setPage(page + 1)}
            className="flex items-center gap-2 rounded-md bg-purple-600 hover:bg-purple-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Load More
          </button>
        </div>
      )}
    </div>
  );
}


