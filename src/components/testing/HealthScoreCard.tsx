'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthScoreCardProps {
  title: string;
  score: number;
  maxScore?: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  issues?: string[];
  recommendations?: string[];
  lastChecked?: Date;
  onRefresh?: () => void;
}

export function HealthScoreCard({
  title,
  score,
  maxScore = 100,
  status,
  issues = [],
  recommendations = [],
  lastChecked,
  onRefresh,
}: HealthScoreCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-5 w-5" />;
      case 'fair':
        return <AlertCircle className="h-5 w-5" />;
      case 'poor':
      case 'critical':
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-6 transition-all duration-200',
        getStatusColor(status)
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon(status)}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
          </button>
        )}
      </div>

      {/* Score Display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold">{score}</span>
          <span className="text-sm opacity-75">/ {maxScore}</span>
          <span className="text-sm font-medium">({percentage}%)</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/50 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              status === 'excellent' && 'bg-green-500',
              status === 'good' && 'bg-blue-500',
              status === 'fair' && 'bg-yellow-500',
              status === 'poor' && 'bg-orange-500',
              status === 'critical' && 'bg-red-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Issues Found:</h4>
          <ul className="space-y-1">
            {issues.slice(0, 3).map((issue, index) => (
              <li
                key={index}
                className="text-sm opacity-90 flex items-start gap-2"
              >
                <span className="text-red-500 mt-0.5">•</span>
                <span>{issue}</span>
              </li>
            ))}
            {issues.length > 3 && (
              <li className="text-sm opacity-75">
                +{issues.length - 3} more issues...
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
          <ul className="space-y-1">
            {recommendations.slice(0, 2).map((rec, index) => (
              <li
                key={index}
                className="text-sm opacity-90 flex items-start gap-2"
              >
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
            {recommendations.length > 2 && (
              <li className="text-sm opacity-75">
                +{recommendations.length - 2} more recommendations...
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Last Checked */}
      {lastChecked && (
        <div className="text-xs opacity-75">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}


