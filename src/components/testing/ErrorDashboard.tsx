'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Trash2,
  Archive,
} from 'lucide-react';
import {
  errorTracker,
  type ErrorLog,
  type ErrorTrend,
} from '@/lib/monitoring/error-tracker';
import { cn } from '@/lib/utils';

interface ErrorDashboardProps {
  className?: string;
}

export function ErrorDashboard({ className }: ErrorDashboardProps) {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [trends, setTrends] = useState<ErrorTrend[]>([]);
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    resolved: undefined as boolean | undefined,
    search: '',
  });
  const [selectedErrors, setSelectedErrors] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadErrors();
    loadTrends();

    // Subscribe to new errors
    const unsubscribe = errorTracker.subscribe((error) => {
      setErrors((prev) => [error, ...prev]);
    });

    return unsubscribe;
  }, []);

  const loadErrors = () => {
    const allErrors = errorTracker.getErrors({
      level: filters.level || undefined,
      category: filters.category || undefined,
      resolved: filters.resolved,
      limit: 100,
    });

    let filteredErrors = allErrors;
    if (filters.search) {
      filteredErrors = allErrors.filter(
        (error) =>
          error.message.toLowerCase().includes(filters.search.toLowerCase()) ||
          error.component
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          error.category.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setErrors(filteredErrors);
    setIsLoading(false);
  };

  const loadTrends = () => {
    const trendData = errorTracker.getErrorTrends(7);
    setTrends(trendData);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    setIsLoading(true);
    loadErrors();
    loadTrends();
  };

  const handleSelectError = (errorId: string) => {
    setSelectedErrors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(errorId)) {
        newSet.delete(errorId);
      } else {
        newSet.add(errorId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedErrors.size === errors.length) {
      setSelectedErrors(new Set());
    } else {
      setSelectedErrors(new Set(errors.map((e) => e.id)));
    }
  };

  const handleResolveSelected = () => {
    selectedErrors.forEach((errorId) => {
      errorTracker.resolveError(errorId, 'user');
    });
    setSelectedErrors(new Set());
    loadErrors();
  };

  const handleExport = () => {
    const data = errorTracker.exportErrors('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      database: 'bg-purple-100 text-purple-800',
      auth: 'bg-green-100 text-green-800',
      email: 'bg-blue-100 text-blue-800',
      ai: 'bg-pink-100 text-pink-800',
      voice: 'bg-orange-100 text-orange-800',
      ui: 'bg-indigo-100 text-indigo-800',
      api: 'bg-cyan-100 text-cyan-800',
      sync: 'bg-teal-100 text-teal-800',
    };
    return (
      colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    );
  };

  const stats = errorTracker.getStats();

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Error Monitoring Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage application errors
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Errors
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Unresolved
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.unresolved}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Critical
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.critical}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Resolution Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.resolutionRate}%
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Level
            </label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Levels</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="database">Database</option>
              <option value="auth">Authentication</option>
              <option value="email">Email</option>
              <option value="ai">AI</option>
              <option value="voice">Voice</option>
              <option value="ui">UI</option>
              <option value="api">API</option>
              <option value="sync">Sync</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={
                filters.resolved === undefined
                  ? ''
                  : filters.resolved.toString()
              }
              onChange={(e) =>
                handleFilterChange(
                  'resolved',
                  e.target.value === '' ? undefined : e.target.value === 'true'
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search errors..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {selectedErrors.size === errors.length && errors.length > 0 ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {selectedErrors.size === errors.length && errors.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
              {selectedErrors.size > 0 && (
                <button
                  onClick={handleResolveSelected}
                  className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
                >
                  <CheckCircle className="h-4 w-4" />
                  Resolve Selected ({selectedErrors.size})
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {errors.length} error{errors.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {errors.map((error) => (
            <div
              key={error.id}
              className={cn(
                'p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                selectedErrors.has(error.id) && 'bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedErrors.has(error.id)}
                  onChange={() => handleSelectError(error.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full border',
                        getLevelColor(error.level)
                      )}
                    >
                      {error.level.toUpperCase()}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        getCategoryColor(error.category)
                      )}
                    >
                      {error.category}
                    </span>
                    {error.component && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        {error.component}
                      </span>
                    )}
                    {error.resolved && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Resolved
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {error.message}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{error.timestamp.toLocaleString()}</span>
                    {error.url && <span>URL: {error.url}</span>}
                    {error.userId && <span>User: {error.userId}</span>}
                  </div>

                  {error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
