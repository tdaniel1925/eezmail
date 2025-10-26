/**
 * Ticket Update API Endpoint
 * Update ticket status, priority, assignment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { supportTickets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logAuditAction } from '@/lib/audit/logger';

const updateTicketSchema = z.object({
  status: z.enum(['new', 'open', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  resolvedAt: z.coerce.date().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateTicketSchema.parse(body);

    // Get existing ticket
    const [existingTicket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id))
      .limit(1);

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Update ticket
    const [updated] = await db
      .update(supportTickets)
      .set(validated)
      .where(eq(supportTickets.id, id))
      .returning();

    // Log audit action
    await logAuditAction({
      actorId: user.id,
      actorType: 'admin',
      action: 'ticket.updated',
      resourceType: 'support_ticket',
      resourceId: id,
      changes: validated,
      metadata: {
        ticketNumber: existingTicket.ticketNumber,
        subject: existingTicket.subject,
      },
      riskLevel: 'low',
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Ticket API] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
