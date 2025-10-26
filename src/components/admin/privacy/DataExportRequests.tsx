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
import { Download, Search, Loader2 } from 'lucide-react';

interface ExportRequest {
  id: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
}

interface DataExportRequestsProps {
  initialRequests: ExportRequest[];
}

export function DataExportRequests({
  initialRequests,
}: DataExportRequestsProps): JSX.Element {
  const [requests, setRequests] = useState<ExportRequest[]>(initialRequests);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string): JSX.Element => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      pending: 'secondary',
      processing: 'default',
      completed: 'outline',
      failed: 'destructive',
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const handleDownload = async (
    userId: string,
    userEmail: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/privacy/export/${userId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${userEmail}-data-export.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed');
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
      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No export requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.userEmail}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {new Date(request.requestedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {request.completedAt
                      ? new Date(request.completedAt).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {request.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDownload(request.userId, request.userEmail)
                        }
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
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
