/**
 * Ticket Detail Page
 * Full ticket view with comments and actions
 */

import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { supportTickets, ticketComments, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { TicketHeader } from '@/components/admin/TicketHeader';
import { TicketComments } from '@/components/admin/TicketComments';
import { TicketActions } from '@/components/admin/TicketActions';
import { TicketUserContext } from '@/components/admin/TicketUserContext';

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({
  params,
}: TicketDetailPageProps) {
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

  const { id } = await params;

  // Get ticket with user info
  const ticketData = await db
    .select({
      ticket: supportTickets,
      user: users,
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .where(eq(supportTickets.id, id))
    .limit(1);

  if (ticketData.length === 0) {
    notFound();
  }

  const { ticket, user: ticketUser } = ticketData[0];

  // Get comments
  const comments = await db
    .select({
      comment: ticketComments,
      author: users,
    })
    .from(ticketComments)
    .leftJoin(users, eq(ticketComments.authorId, users.id))
    .where(eq(ticketComments.ticketId, id))
    .orderBy(desc(ticketComments.createdAt));

  // Get assignee info
  let assignee = null;
  if (ticket.assignedTo) {
    const assigneeData = await db
      .select()
      .from(users)
      .where(eq(users.id, ticket.assignedTo))
      .limit(1);
    assignee = assigneeData[0] || null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <TicketHeader ticket={ticket} assignee={assignee} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* Comments */}
            <Suspense fallback={<div>Loading comments...</div>}>
              <TicketComments
                ticketId={ticket.id}
                comments={comments}
                currentUserId={user.id}
              />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <TicketActions ticket={ticket} currentUserId={user.id} />

            {/* User Context */}
            {ticketUser && <TicketUserContext user={ticketUser} />}
          </div>
        </div>
      </div>
    </div>
  );
}
