'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: string;
  service: string;
  message: string;
  userId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

interface LogResultsProps {
  params: {
    query?: string;
    level?: string;
    service?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function LogResults({ params }: LogResultsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [params]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Mock data for demonstration
      // In production, this would call an API that queries Elasticsearch or logs database
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date(),
          level: 'error',
          service: 'email-sync',
          message: 'Failed to sync Microsoft account',
          userId: 'user-123',
          correlationId: 'corr-456',
          metadata: {
            accountId: 'acc-789',
            error: 'Token expired',
            retryAttempt: 3,
          },
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 300000),
          level: 'warn',
          service: 'api',
          message: 'Rate limit approaching for user',
          userId: 'user-456',
          correlationId: 'corr-789',
          metadata: {
            endpoint: '/api/emails',
            requestCount: 450,
            limit: 500,
          },
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 600000),
          level: 'info',
          service: 'auth',
          message: 'User logged in successfully',
          userId: 'user-123',
          correlationId: 'corr-012',
          metadata: {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
          },
        },
      ];

      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'secondary';
      case 'info':
        return 'default';
      case 'debug':
        return 'outline';
      default:
        return 'default';
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Level', 'Service', 'Message', 'User ID', 'Correlation ID'],
      ...logs.map((log) => [
        format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        log.level,
        log.service,
        log.message,
        log.userId || '',
        log.correlationId || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Loading logs...
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No logs found matching your criteria
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Found {logs.length} log {logs.length === 1 ? 'entry' : 'entries'}
        </p>
        <Button variant="outline" size="sm" onClick={exportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-4">
              <div
                className="flex cursor-pointer items-start justify-between"
                onClick={() =>
                  setExpandedLog(expandedLog === log.id ? null : log.id)
                }
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getLevelColor(log.level) as any}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {format(log.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                    <Badge variant="outline">{log.service}</Badge>
                    {log.correlationId && (
                      <span className="text-xs font-mono text-gray-400">
                        {log.correlationId}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {log.message}
                  </p>
                  {log.userId && (
                    <p className="text-xs text-gray-500 mt-1">
                      User: {log.userId}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  {expandedLog === log.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedLog === log.id && log.metadata && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-gray-700">
                    Metadata:
                  </p>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
