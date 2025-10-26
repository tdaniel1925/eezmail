'use client';

/**
 * Ticket User Context Component
 * Displays user information and quick actions
 */

import { Button } from '@/components/ui/button';
import { Mail, User, Building, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface TicketUserContextProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier: string | null;
    createdAt: Date;
  };
}

export function TicketUserContext({ user }: TicketUserContextProps) {
  return (
    <div className="rounded-lg border bg-white p-6 space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold">User Context</h2>
      </div>

      <div className="space-y-3">
        {/* Name */}
        {user.name && (
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{user.name}</p>
          </div>
        )}

        {/* Email */}
        <div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Mail className="h-3 w-3" />
            Email
          </p>
          <p className="font-medium text-sm">{user.email}</p>
        </div>

        {/* Tier */}
        {user.tier && (
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Building className="h-3 w-3" />
              Plan
            </p>
            <p className="font-medium capitalize">{user.tier}</p>
          </div>
        )}

        {/* Member Since */}
        <div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Member Since
          </p>
          <p className="font-medium text-sm">
            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t space-y-2">
        <Link href={`/admin/users?search=${user.email}`}>
          <Button variant="outline" className="w-full" size="sm">
            View Full Profile
          </Button>
        </Link>
        <Link href={`/admin/audit-logs?actor=${user.id}`}>
          <Button variant="outline" className="w-full" size="sm">
            View Activity Log
          </Button>
        </Link>
      </div>
    </div>
  );
}
