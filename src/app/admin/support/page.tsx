/**
 * Support Tickets Admin Page
 * Ticket queue with filtering and management
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TicketsTable } from '@/components/admin/TicketsTable';
import { TicketsFilters } from '@/components/admin/TicketsFilters';
import { TicketStats } from '@/components/admin/TicketStats';
import { Button } from '@/components/ui/button';
import { Plus, Ticket } from 'lucide-react';
import { InlineNotification } from '@/components/ui/inline-notification';

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    urgent: 0,
    breachingSLA: 0,
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadTickets() {
      setLoading(true);
      setNotification(null);

      try {
        // Fetch tickets from API (API will handle auth)
        const params = new URLSearchParams();
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const assigned = searchParams.get('assigned');
        const search = searchParams.get('search');
        const page = searchParams.get('page') || '1';

        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        if (assigned) params.append('assigned', assigned);
        if (search) params.append('search', search);
        params.append('page', page);

        const response = await fetch(
          `/api/admin/support/tickets?${params.toString()}`
        );

        if (response.status === 401) {
          // Not authenticated
          router.push('/login');
          return;
        }

        if (response.status === 403) {
          // Not authorized (not an admin)
          router.push('/dashboard');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }

        const data = await response.json();
        setTickets(data.tickets || []);
        setStats(data.stats || stats);
      } catch (error) {
        console.error('Error loading tickets:', error);
        setNotification({
          type: 'error',
          message:
            error instanceof Error ? error.message : 'Failed to load tickets',
        });
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {notification && (
          <InlineNotification
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
              <Ticket className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
              <p className="text-sm text-gray-400">
                Manage customer support requests
              </p>
            </div>
          </div>

          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => router.push('/admin/support/new')}
          >
            <Plus className="h-4 w-4" />
            <span>New Ticket</span>
          </Button>
        </div>

        {/* Statistics */}
        <TicketStats stats={stats} />

        {/* Filters */}
        <TicketsFilters
          initialFilter={{
            status: searchParams.get('status') || undefined,
            priority: searchParams.get('priority') || undefined,
            assigned: searchParams.get('assigned') || undefined,
            search: searchParams.get('search') || undefined,
          }}
        />

        {/* Tickets Table */}
        {loading ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-8 text-center">
            <div className="animate-pulse text-gray-300">
              Loading tickets...
            </div>
          </div>
        ) : (
          <TicketsTable
            tickets={tickets}
            currentPage={parseInt(searchParams.get('page') || '1')}
          />
        )}
      </div>
    </div>
  );
}
