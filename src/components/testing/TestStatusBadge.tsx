'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Play,
  Pause,
  Settings,
} from 'lucide-react';
// Test scheduler will be accessed via API routes
import { cn } from '@/lib/utils';

interface TestStatusBadgeProps {
  className?: string;
  showDetails?: boolean;
}

export function TestStatusBadge({
  className,
  showDetails = false,
}: TestStatusBadgeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [stats, setStats] = useState({
    totalTests: 0,
    passedTests: 0,
    averageScore: 0,
    successRate: 0,
  });

  useEffect(() => {
    loadStatus();

    // Update status every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/testing/scheduler');
      const data = await response.json();

      if (data.success) {
        setIsRunning(data.isRunning);
        const history = data.history || [];
        const latestResult = history[0] || null;

        // Calculate stats from history
        const totalTests = history.length;
        const passedTests = history.filter((r: any) => r.score >= 80).length;
        const averageScore =
          totalTests > 0
            ? Math.round(
                history.reduce((sum: number, r: any) => sum + r.score, 0) /
                  totalTests
              )
            : 0;
        const successRate =
          totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

        setLastResult(latestResult);
        setStats({
          totalTests,
          passedTests,
          averageScore,
          successRate,
        });
      }
    } catch (error) {
      console.error('Failed to load test status:', error);
    }
  };

  const handleToggle = async () => {
    try {
      const action = isRunning ? 'stop' : 'start';
      const response = await fetch('/api/testing/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (data.success) {
        setIsRunning(!isRunning);
        loadStatus();
      }
    } catch (error) {
      console.error('Failed to toggle test scheduler:', error);
    }
  };

  const handleRunNow = async () => {
    try {
      const response = await fetch('/api/testing/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run' }),
      });

      const data = await response.json();
      if (data.success) {
        loadStatus();
      }
    } catch (error) {
      console.error('Failed to run test:', error);
    }
  };

  const getStatusColor = () => {
    if (!lastResult) return 'text-gray-500';
    if (lastResult.passed) return 'text-green-500';
    if (lastResult.score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (!lastResult) return Clock;
    if (lastResult.passed) return CheckCircle;
    if (lastResult.score >= 60) return AlertTriangle;
    return AlertTriangle;
  };

  const getStatusText = () => {
    if (!lastResult) return 'No tests run';
    if (lastResult.passed) return 'All tests passed';
    if (lastResult.score >= 60) return 'Some tests failed';
    return 'Tests failed';
  };

  const StatusIcon = getStatusIcon();

  if (!showDetails) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          onClick={handleToggle}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            isRunning
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          )}
        >
          {isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunning ? 'Stop Tests' : 'Start Tests'}
        </button>

        <div className={cn('flex items-center gap-1', getStatusColor())}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {lastResult ? `${lastResult.score}/100` : 'N/A'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Test Status
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunNow}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Run Now
          </button>
          <button
            onClick={handleToggle}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors',
              isRunning
                ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
                : 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'
            )}
          >
            {isRunning ? (
              <>
                <Pause className="h-3 w-3" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Start
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Current Status */}
        <div className="flex items-center gap-3">
          <StatusIcon className={cn('h-5 w-5', getStatusColor())} />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {getStatusText()}
            </p>
            {lastResult && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last run: {lastResult.timestamp.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.averageScore}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Avg Score
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.successRate}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Success Rate
            </p>
          </div>
        </div>

        {/* Recent Results */}
        {lastResult && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Duration: {Math.round(lastResult.duration / 1000)}s</span>
              <span>Score: {lastResult.score}/100</span>
            </div>
            {lastResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-red-600 dark:text-red-400">
                  {lastResult.errors.length} error
                  {lastResult.errors.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
