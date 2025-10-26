'use client';

/**
 * Audit Logs Table Component
 * Displays audit logs with pagination and status indicators
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuditLogEntry } from '@/lib/audit/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuditLogsTableProps {
  logs: AuditLogEntry[];
  total: number;
  currentPage: number;
}

export function AuditLogsTable({
  logs,
  total,
  currentPage,
}: AuditLogsTableProps) {
  const router = useRouter();
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const totalPages = Math.ceil(total / 50);

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'critical':
        return <ShieldAlert className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  No audit logs found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell className="font-mono text-sm">
                    {log.createdAt
                      ? formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {log.actorEmail || 'System'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.actorType}
                        {log.impersonatorId && (
                          <Badge variant="outline" className="ml-2">
                            Impersonated
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{log.resourceType}</div>
                      {log.resourceId && (
                        <div className="text-xs text-gray-500 font-mono truncate max-w-[150px]">
                          {log.resourceId}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRiskIcon(log.riskLevel || 'low')}
                      <Badge
                        variant={getRiskBadgeVariant(log.riskLevel || 'low')}
                      >
                        {log.riskLevel || 'low'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">
                    {log.ipAddress || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * 50 + 1} to{' '}
            {Math.min(currentPage * 50, total)} of {total} logs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Audit Log Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                <dd className="text-sm mt-1">
                  {selectedLog.createdAt
                    ? new Date(selectedLog.createdAt).toLocaleString()
                    : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Actor</dt>
                <dd className="text-sm mt-1">
                  {selectedLog.actorEmail} ({selectedLog.actorType})
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Action</dt>
                <dd className="text-sm mt-1">{selectedLog.action}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Resource</dt>
                <dd className="text-sm mt-1">
                  {selectedLog.resourceType}
                  {selectedLog.resourceId && ` (${selectedLog.resourceId})`}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Risk Level
                </dt>
                <dd className="text-sm mt-1 flex items-center gap-2">
                  {getRiskIcon(selectedLog.riskLevel || 'low')}
                  {selectedLog.riskLevel || 'low'}
                </dd>
              </div>
              {selectedLog.ipAddress && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    IP Address
                  </dt>
                  <dd className="text-sm mt-1 font-mono">
                    {selectedLog.ipAddress}
                  </dd>
                </div>
              )}
              {selectedLog.userAgent && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    User Agent
                  </dt>
                  <dd className="text-sm mt-1 break-all">
                    {selectedLog.userAgent}
                  </dd>
                </div>
              )}
              {selectedLog.changes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Changes</dt>
                  <dd className="text-sm mt-1">
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
              {selectedLog.metadata && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Metadata
                  </dt>
                  <dd className="text-sm mt-1">
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
