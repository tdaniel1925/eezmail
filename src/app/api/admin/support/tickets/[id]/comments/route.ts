/**
 * Ticket Comments API Endpoint
 * Add comments to tickets
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { ticketComments, supportTickets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logAuditAction } from '@/lib/audit/logger';

const createCommentSchema = z.object({
  comment: z.string().min(1),
  isInternal: z.boolean().default(false),
});

export async function POST(
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

    const { id: ticketId } = await params;
    const body = await request.json();
    const validated = createCommentSchema.parse(body);

    // Verify ticket exists
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Create comment
    const [comment] = await db
      .insert(ticketComments)
      .values({
        ticketId,
        authorId: user.id,
        comment: validated.comment,
        isInternal: validated.isInternal,
      })
      .returning();

    // Update ticket first_response_at if this is the first response
    if (!ticket.firstResponseAt) {
      await db
        .update(supportTickets)
        .set({ firstResponseAt: new Date() })
        .where(eq(supportTickets.id, ticketId));
    }

    // Log audit action
    await logAuditAction({
      actorId: user.id,
      actorType: 'admin',
      action: 'ticket.comment_added',
      resourceType: 'support_ticket',
      resourceId: ticketId,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        isInternal: validated.isInternal,
        commentId: comment.id,
      },
      riskLevel: 'low',
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('[Comments API] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
