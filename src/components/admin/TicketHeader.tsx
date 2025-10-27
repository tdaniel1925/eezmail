'use client';

/**
 * Ticket Header Component
 * Displays ticket number, subject, and metadata
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TicketHeaderProps {
  ticket: {
    ticketNumber: number;
    subject: string;
    status: string;
    priority: string;
    category: string | null;
    createdAt: Date;
    firstResponseAt: Date | null;
    resolvedAt: Date | null;
  };
  assignee: {
    name: string | null;
    email: string;
  } | null;
}

export function TicketHeader({ ticket, assignee }: TicketHeaderProps) {
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

  return (
    <div className="rounded-lg border bg-white p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => (window.location.href = '/admin/support')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span className="text-sm text-gray-500 font-mono">
              #{ticket.ticketNumber}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="secondary"
              className={getStatusBadge(ticket.status)}
            >
              {ticket.status}
            </Badge>
            <Badge
              variant="outline"
              className={getPriorityBadge(ticket.priority)}
            >
              {ticket.priority}
            </Badge>
            {ticket.category && (
              <Badge variant="outline" className="bg-purple-50 text-purple-800">
                {ticket.category}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            Created{' '}
            {formatDistanceToNow(new Date(ticket.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {assignee && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Assigned to {assignee.name || assignee.email}</span>
          </div>
        )}

        {ticket.firstResponseAt && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              First response{' '}
              {formatDistanceToNow(new Date(ticket.firstResponseAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
