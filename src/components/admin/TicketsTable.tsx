'use client';

/**
 * Tickets Table Component
 * Displays support tickets with status and priority indicators
 */

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TicketsTableProps {
  tickets: Array<{
    ticket: {
      id: string;
      ticketNumber: number;
      subject: string;
      status: string;
      priority: string;
      slaResponseBy: Date | null;
      firstResponseAt: Date | null;
      createdAt: Date;
    };
    assignee: {
      id: string;
      email: string;
      name: string | null;
    } | null;
  }>;
  currentPage: number;
}

export function TicketsTable({ tickets, currentPage }: TicketsTableProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'bg-blue-100 text-blue-800',
      open: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return variants[status as keyof typeof variants] || variants.new;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      normal: 'bg-blue-100 text-blue-800 border-blue-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return variants[priority as keyof typeof variants] || variants.normal;
  };

  const isSLABreach = (ticket: TicketsTableProps['tickets'][0]['ticket']) => {
    if (!ticket.slaResponseBy || ticket.firstResponseAt) return false;
    return new Date(ticket.slaResponseBy) < new Date();
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Ticket #</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No tickets found
              </TableCell>
            </TableRow>
          ) : (
            tickets.map(({ ticket, assignee }) => (
              <TableRow
                key={ticket.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/admin/support/${ticket.id}`)}
              >
                <TableCell className="font-mono text-sm">
                  #{ticket.ticketNumber}
                </TableCell>
                <TableCell>
                  <div className="max-w-md">
                    <div className="font-medium text-sm truncate">
                      {ticket.subject}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getStatusBadge(ticket.status)}
                  >
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getPriorityBadge(ticket.priority)}
                  >
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {assignee.name || assignee.email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {ticket.slaResponseBy && !ticket.firstResponseAt ? (
                    <div
                      className={`flex items-center gap-2 ${
                        isSLABreach(ticket) ? 'text-red-600' : 'text-gray-600'
                      }`}
                    >
                      {isSLABreach(ticket) ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      <span className="text-xs">
                        {formatDistanceToNow(new Date(ticket.slaResponseBy), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  ) : ticket.firstResponseAt ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs">Met</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(ticket.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/support/${ticket.id}`);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
