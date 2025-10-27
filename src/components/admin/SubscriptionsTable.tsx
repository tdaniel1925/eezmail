'use client';

/**
 * Subscriptions Table Component
 * Displays user subscriptions with management actions
 */

import { useState } from 'react';
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
import { Ban, RotateCcw, ExternalLink, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SubscriptionsTableProps {
  subscriptions: any[];
  onUpdate: () => void;
  onNotification: (notification: {
    type: 'success' | 'error' | 'info';
    message: string;
  }) => void;
}

export function SubscriptionsTable({
  subscriptions,
  onUpdate,
  onNotification,
}: SubscriptionsTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    setActionLoading(subscriptionId);
    try {
      const response = await fetch(
        `/api/admin/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      onNotification({
        type: 'success',
        message: 'Subscription canceled successfully!',
      });
      setTimeout(() => onUpdate(), 1000);
    } catch (error) {
      console.error('Cancel error:', error);
      onNotification({
        type: 'error',
        message: 'Failed to cancel subscription',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to reactivate this subscription?'))
      return;

    setActionLoading(subscriptionId);
    try {
      const response = await fetch(
        `/api/admin/subscriptions/${subscriptionId}/reactivate`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      onNotification({
        type: 'success',
        message: 'Subscription reactivated successfully!',
      });
      setTimeout(() => onUpdate(), 1000);
    } catch (error) {
      console.error('Reactivate error:', error);
      onNotification({
        type: 'error',
        message: 'Failed to reactivate subscription',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'trialing':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'past_due':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'canceled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'unpaid':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'starter':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'professional':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'enterprise':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-700/50 border-slate-700">
            <TableHead className="text-gray-300">User</TableHead>
            <TableHead className="text-gray-300">Plan</TableHead>
            <TableHead className="text-gray-300">Status</TableHead>
            <TableHead className="text-gray-300">Price</TableHead>
            <TableHead className="text-gray-300">Started</TableHead>
            <TableHead className="text-gray-300">Stripe</TableHead>
            <TableHead className="text-right text-gray-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                No subscriptions found.
              </TableCell>
            </TableRow>
          ) : (
            subscriptions.map((sub) => (
              <TableRow
                key={sub.id}
                className="hover:bg-slate-700/30 transition-colors border-slate-700"
              >
                <TableCell>
                  <div>
                    <div className="font-medium text-white">
                      {sub.user?.name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {sub.user?.email || 'No email'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getTierBadge(sub.tier)} variant="secondary">
                    {sub.tier}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={getStatusBadge(sub.status)}
                    variant="secondary"
                  >
                    {sub.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-white">
                    ${parseFloat(sub.monthlyAmount || '0').toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">per month</div>
                  {sub.seats && sub.seats > 1 && (
                    <div className="text-xs text-blue-400">
                      {sub.seats} seats
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-400">
                  {sub.startDate
                    ? formatDistanceToNow(new Date(sub.startDate), {
                        addSuffix: true,
                      })
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {sub.processorSubscriptionId ? (
                    <a
                      href={`https://dashboard.stripe.com/subscriptions/${sub.processorSubscriptionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="View details"
                      className="text-gray-300 hover:text-white hover:bg-slate-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {sub.status === 'canceled' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReactivateSubscription(sub.id)}
                        disabled={actionLoading === sub.id}
                        title="Reactivate subscription"
                        className="text-green-400 hover:text-green-300 hover:bg-slate-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelSubscription(sub.id)}
                        disabled={actionLoading === sub.id}
                        title="Cancel subscription"
                        className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
