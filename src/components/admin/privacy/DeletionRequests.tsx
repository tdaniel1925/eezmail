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
import { Search, Trash2, XCircle, Clock } from 'lucide-react';

interface DeletionRequest {
  id: string;
  userId: string;
  userEmail: string;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  scheduledFor: Date;
  completedAt?: Date;
}

interface DeletionRequestsProps {
  initialRequests: DeletionRequest[];
}

export function DeletionRequests({
  initialRequests,
}: DeletionRequestsProps): JSX.Element {
  const [requests, setRequests] = useState<DeletionRequest[]>(initialRequests);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  const handleCancel = async (
    requestId: string,
    userId: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/privacy/delete/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (response.ok) {
        setRequests(requests.filter((r) => r.id !== requestId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Cancellation failed');
      }
    } catch (error) {
      console.error('Cancellation failed:', error);
      alert('Cancellation failed');
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  const getDaysRemaining = (scheduledFor: Date): number => {
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

  return (
    <>
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
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Scheduled For</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No deletion requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.userEmail}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {request.reason || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {new Date(request.requestedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(request.scheduledFor).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span>
                            {getDaysRemaining(request.scheduledFor)} days
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(request.id)}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4 text-orange-500" />
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Deletion Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the scheduled deletion for this user. They will
              need to submit a new request if they change their mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const request = requests.find((r) => r.id === deleteId);
                if (request) {
                  handleCancel(request.id, request.userId);
                }
              }}
            >
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
