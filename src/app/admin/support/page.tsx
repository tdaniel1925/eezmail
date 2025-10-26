/**
 * Support Tickets Admin Page
 * Ticket queue with filtering and management
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { supportTickets, users } from '@/db/schema';
import { desc, eq, and, or, ilike, lte, isNull } from 'drizzle-orm';
import { TicketsTable } from '@/components/admin/TicketsTable';
import { TicketsFilters } from '@/components/admin/TicketsFilters';
import { TicketStats } from '@/components/admin/TicketStats';
import { Button } from '@/components/ui/button';
import { Plus, Ticket } from 'lucide-react';
import Link from 'next/link';

interface TicketsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    priority?: string;
    assigned?: string;
    search?: string;
  }>;
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  // Build query conditions
  const conditions = [];
  if (params.status) conditions.push(eq(supportTickets.status, params.status));
  if (params.priority)
    conditions.push(eq(supportTickets.priority, params.priority));
  if (params.assigned === 'me')
    conditions.push(eq(supportTickets.assignedTo, user.id));
  if (params.assigned === 'unassigned')
    conditions.push(isNull(supportTickets.assignedTo));
  if (params.search) {
    conditions.push(
      or(
        ilike(supportTickets.subject, `%${params.search}%`),
        ilike(supportTickets.description, `%${params.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get tickets with user info
  const tickets = await db
    .select({
      ticket: supportTickets,
      assignee: users,
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.assignedTo, users.id))
    .where(whereClause)
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit)
    .offset(offset);

  // Get statistics
  const allTickets = await db.select().from(supportTickets);

  const stats = {
    total: allTickets.length,
    open: allTickets.filter((t) => t.status === 'open' || t.status === 'new')
      .length,
    pending: allTickets.filter((t) => t.status === 'pending').length,
    urgent: allTickets.filter((t) => t.priority === 'urgent').length,
    breachingSLA: allTickets.filter(
      (t) =>
        t.slaResponseBy &&
        new Date(t.slaResponseBy) < new Date() &&
        !t.firstResponseAt
    ).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Support Tickets
              </h1>
              <p className="text-sm text-gray-500">
                Manage customer support requests
              </p>
            </div>
          </div>

          <Link href="/admin/support/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Statistics */}
        <TicketStats stats={stats} />

        {/* Filters */}
        <TicketsFilters
          initialFilter={{
            status: params.status,
            priority: params.priority,
            assigned: params.assigned,
            search: params.search,
          }}
        />

        {/* Tickets Table */}
        <Suspense
          fallback={
            <div className="rounded-lg border bg-white p-8 text-center">
              <div className="animate-pulse">Loading tickets...</div>
            </div>
          }
        >
          <TicketsTable tickets={tickets} currentPage={page} />
        </Suspense>
      </div>
    </div>
  );
}
