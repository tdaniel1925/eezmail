'use client';

import { useState } from 'react';
import { Search, Filter, Download, Trash2, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: string;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface ActionResult {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export default function LogSearchPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setActionResult(null);

    try {
      const params = new URLSearchParams({
        query: searchQuery,
        level: levelFilter,
        category: categoryFilter,
        timeRange: timeRange,
      });

      const response = await fetch(`/api/admin/logs/search?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      
      if (data.logs.length === 0) {
        setActionResult({
          type: 'warning',
          message: 'No logs found matching your search criteria',
        });
      } else {
        setActionResult({
          type: 'success',
          message: `Found ${data.logs.length} log entries`,
        });
      }
    } catch (error) {
      console.error('Failed to search logs:', error);
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to search logs',
      });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setActionResult(null);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        level: levelFilter,
        category: categoryFilter,
        timeRange: timeRange,
      });

      const response = await fetch(`/api/admin/logs/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setActionResult({
        type: 'success',
        message: 'Logs exported successfully',
      });
    } catch (error) {
      console.error('Failed to export logs:', error);
      setActionResult({
        type: 'error',
        message: 'Failed to export logs',
      });
    }
  };

  const handleClearOldLogs = async () => {
    setActionResult(null);
    try {
      const response = await fetch('/api/admin/logs/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ olderThan: '30d' }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear old logs');
      }

      const data = await response.json();
      setActionResult({
        type: 'success',
        message: `Cleared ${data.deletedCount || 0} old log entries`,
      });
      
      // Refresh results
      handleSearch();
    } catch (error) {
      console.error('Failed to clear logs:', error);
      setActionResult({
        type: 'error',
        message: 'Failed to clear old logs',
      });
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'debug':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Explanation */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Log Search
        </h1>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
            <strong>🔍 What is this page for?</strong>
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
            This tool allows you to search, filter, and analyze application logs for debugging, monitoring, and troubleshooting.
            Use it to track errors, identify patterns, and investigate issues reported by users.
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li><strong>Search Logs:</strong> Full-text search across all log messages and metadata</li>
            <li><strong>Filter by Level:</strong> View only errors, warnings, info, or debug logs</li>
            <li><strong>Filter by Category:</strong> Focus on specific system components (auth, sync, email, etc.)</li>
            <li><strong>Time Range:</strong> View logs from last hour, 24 hours, 7 days, or 30 days</li>
            <li><strong>Export:</strong> Download logs as JSON for external analysis</li>
            <li><strong>Cleanup:</strong> Remove old logs to free up database space</li>
          </ul>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-3">
            💡 <strong>Common uses:</strong> Track sync errors, debug OAuth failures, monitor performance issues, investigate user-reported bugs
          </p>
        </div>
      </div>

      {/* Inline Action Result */}
      {actionResult && (
        <div
          className={`rounded-lg p-4 flex items-start gap-3 ${
            actionResult.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : actionResult.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {actionResult.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : actionResult.type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                actionResult.type === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : actionResult.type === 'warning'
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-red-800 dark:text-red-200'
              }`}
            >
              {actionResult.message}
            </p>
          </div>
          <button
            onClick={() => setActionResult(null)}
            className="text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search & Filter
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Query */}
          <div className="lg:col-span-2">
            <Label htmlFor="search">Search Query</Label>
            <Input
              id="search"
              placeholder="Search log messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* Level Filter */}
          <div>
            <Label htmlFor="level">Log Level</Label>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger id="level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="sync">Email Sync</SelectItem>
                <SelectItem value="email">Email Processing</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="inngest">Background Jobs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          {/* Time Range */}
          <div className="flex-1">
            <Label htmlFor="timeRange">Time Range</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger id="timeRange">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 items-end">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
            <Button onClick={handleExport} variant="outline" disabled={logs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleClearOldLogs} variant="outline">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Old Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Log Results */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Log Entries
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {logs.length > 0 ? `Showing ${logs.length} entries` : 'Run a search to see results'}
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Bug className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No logs found. Use the filters above to search.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getLevelColor(log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {log.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white font-mono">
                  {log.message}
                </p>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:underline">
                      Show metadata
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
