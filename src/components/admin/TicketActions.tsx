'use client';

/**
 * Ticket Actions Component
 * Quick actions for ticket management
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, XCircle, UserPlus } from 'lucide-react';
import { InlineNotification } from '@/components/ui/inline-notification';

interface TicketActionsProps {
  ticket: {
    id: string;
    status: string;
    priority: string;
    assignedTo: string | null;
  };
  currentUserId: string;
}

export function TicketActions({ ticket, currentUserId }: TicketActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const updateTicket = async (updates: Record<string, unknown>) => {
    setIsUpdating(true);
    setNotification(null);
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update ticket');
      }

      setNotification({
        type: 'success',
        message: 'Ticket updated successfully',
      });

      // Refresh after a short delay to show success message
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Failed to update ticket:', error);
      setNotification({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to update ticket',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignToMe = () => {
    updateTicket({ assignedTo: currentUserId });
  };

  const handleResolve = () => {
    updateTicket({ status: 'resolved', resolvedAt: new Date().toISOString() });
  };

  const handleClose = () => {
    updateTicket({ status: 'closed' });
  };

  return (
    <div className="rounded-lg border bg-white p-6 space-y-4">
      {notification && (
        <InlineNotification
          type={notification.type}
          message={notification.message}
          onDismiss={() => setNotification(null)}
        />
      )}

      <h2 className="text-lg font-semibold">Quick Actions</h2>

      {/* Assign to Me */}
      {!ticket.assignedTo && (
        <Button
          onClick={handleAssignToMe}
          disabled={isUpdating}
          className="w-full gap-2"
          variant="outline"
        >
          <UserPlus className="h-4 w-4" />
          Assign to Me
        </Button>
      )}

      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={ticket.status}
          onValueChange={(value) => updateTicket({ status: value })}
          disabled={isUpdating}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Priority</label>
        <Select
          value={ticket.priority}
          onValueChange={(value) => updateTicket({ priority: value })}
          disabled={isUpdating}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-4 border-t space-y-2">
        {/* Resolve */}
        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
          <Button
            onClick={handleResolve}
            disabled={isUpdating}
            className="w-full gap-2"
            variant="default"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark as Resolved
          </Button>
        )}

        {/* Close */}
        {ticket.status !== 'closed' && (
          <Button
            onClick={handleClose}
            disabled={isUpdating}
            className="w-full gap-2"
            variant="outline"
          >
            <XCircle className="h-4 w-4" />
            Close Ticket
          </Button>
        )}
      </div>
    </div>
  );
}
