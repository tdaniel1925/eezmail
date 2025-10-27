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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, XCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface DeletionRequest {
  id: string;
  userId: string;
  userEmail: string;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  scheduledFor: string;
  completedAt?: string;
  errorMessage?: string;
}

interface DeletionRequestsTableProps {
  requests: DeletionRequest[];
  onRefresh: () => void;
  setNotification: (
    notif: { type: 'success' | 'error' | 'info'; message: string } | null
  ) => void;
}

export function DeletionRequestsTable({
  requests,
  onRefresh,
  setNotification,
}: DeletionRequestsTableProps) {
  const [search, setSearch] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'cancelled':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const handleCancel = async (request: DeletionRequest) => {
    setLoading(true);
    setNotification(null);
    try {
      const response = await fetch(
        `/api/admin/privacy/deletion/${request.id}/cancel`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Cancellation failed');
      }

      setNotification({
        type: 'success',
        message: `Deletion request for ${request.userEmail} cancelled successfully!`,
      });
      onRefresh();
    } catch (error: any) {
      console.error('Cancellation failed:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Cancellation failed',
      });
    } finally {
      setLoading(false);
      setCancelId(null);
    }
  };

  const getDaysRemaining = (scheduledFor: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledFor);
    const diff = scheduled.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredRequests = search
    ? requests.filter((r) =>
        r.userEmail.toLowerCase().includes(search.toLowerCase())
      )
    : requests;

  const requestToCancel = requests.find((r) => r.id === cancelId);

  return (
    <>
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
                <TableHead className="text-gray-300">Reason</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Requested</TableHead>
                <TableHead className="text-gray-300">Scheduled For</TableHead>
                <TableHead className="text-gray-300">Days Remaining</TableHead>
                <TableHead className="text-right text-gray-300">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-400 py-8"
                  >
                    No deletion requests found
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
                    <TableCell className="text-sm text-gray-400">
                      {request.reason || '-'}
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
                      {format(new Date(request.scheduledFor), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' ? (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Clock className="h-4 w-4" />
                          <span>
                            {getDaysRemaining(request.scheduledFor)} days
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelId(request.id)}
                          disabled={loading}
                          className="text-orange-400 hover:text-orange-300 hover:bg-slate-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Deletion Request?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will cancel the scheduled deletion for{' '}
              <strong className="text-white">
                {requestToCancel?.userEmail}
              </strong>
              . They will need to submit a new request if they change their
              mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => requestToCancel && handleCancel(requestToCancel)}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
