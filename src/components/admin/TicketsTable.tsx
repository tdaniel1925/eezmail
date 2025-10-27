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
      new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      open: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      pending: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
      closed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return variants[status as keyof typeof variants] || variants.new;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      normal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return variants[priority as keyof typeof variants] || variants.normal;
  };

  const isSLABreach = (ticket: TicketsTableProps['tickets'][0]['ticket']) => {
    if (!ticket.slaResponseBy || ticket.firstResponseAt) return false;
    return new Date(ticket.slaResponseBy) < new Date();
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-700/50 border-slate-700">
            <TableHead className="text-gray-300">Ticket #</TableHead>
            <TableHead className="text-gray-300">Subject</TableHead>
            <TableHead className="text-gray-300">Status</TableHead>
            <TableHead className="text-gray-300">Priority</TableHead>
            <TableHead className="text-gray-300">Assigned To</TableHead>
            <TableHead className="text-gray-300">SLA</TableHead>
            <TableHead className="text-gray-300">Created</TableHead>
            <TableHead className="text-right text-gray-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                No tickets found
              </TableCell>
            </TableRow>
          ) : (
            tickets.map(({ ticket, assignee }) => (
              <TableRow
                key={ticket.id}
                className="hover:bg-slate-700/30 cursor-pointer transition-colors border-slate-700"
                onClick={() => router.push(`/admin/support/${ticket.id}`)}
              >
                <TableCell className="font-mono text-sm text-gray-300">
                  #{ticket.ticketNumber}
                </TableCell>
                <TableCell>
                  <div className="max-w-md">
                    <div className="font-medium text-sm truncate text-white">
                      {ticket.subject}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
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
                      <span className="text-sm text-gray-300">
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
                        isSLABreach(ticket) ? 'text-red-400' : 'text-gray-400'
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
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs">Met</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-400">
                  {formatDistanceToNow(new Date(ticket.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-white hover:bg-slate-700"
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
