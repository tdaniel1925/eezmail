'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ExportRequest {
  id: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

interface DataExportRequestsTableProps {
  requests: ExportRequest[];
  onRefresh: () => void;
  setNotification: (
    notif: { type: 'success' | 'error' | 'info'; message: string } | null
  ) => void;
}

export function DataExportRequestsTable({
  requests,
  onRefresh,
  setNotification,
}: DataExportRequestsTableProps) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const handleDownload = async (request: ExportRequest) => {
    setLoading(true);
    setNotification(null);
    try {
      const response = await fetch(
        `/api/admin/privacy/export/${request.userId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${request.userEmail}-data-export.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setNotification({
        type: 'success',
        message: `Download started for ${request.userEmail}`,
      });
    } catch (error: any) {
      console.error('Download failed:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Download failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = search
    ? requests.filter((r) =>
        r.userEmail.toLowerCase().includes(search.toLowerCase())
      )
    : requests;

  return (
    <div className="space-y-4">
      {/* Search & Refresh */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Requests Table */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-700/50 border-slate-700">
              <TableHead className="text-gray-300">User Email</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Requested</TableHead>
              <TableHead className="text-gray-300">Completed</TableHead>
              <TableHead className="text-right text-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-400 py-8"
                >
                  No export requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow
                  key={request.id}
                  className="hover:bg-slate-700/30 border-slate-700"
                >
                  <TableCell className="font-medium text-white">
                    {request.userEmail}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getStatusBadge(request.status)}
                      variant="secondary"
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {formatDistanceToNow(new Date(request.requestedAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {request.completedAt
                      ? formatDistanceToNow(new Date(request.completedAt), {
                          addSuffix: true,
                        })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(request)}
                        disabled={loading}
                        className="text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </>
                        )}
                      </Button>
                    )}
                    {request.status === 'failed' && request.errorMessage && (
                      <span className="text-xs text-red-400">
                        {request.errorMessage}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
