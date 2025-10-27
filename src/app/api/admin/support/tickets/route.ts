/**
 * Support Tickets API Endpoint
 * Create and list tickets
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { supportTickets, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(3).max(500),
  description: z.string().min(10),
  category: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role using Drizzle
    const [dbUser] = await db
      .select({
        role: users.role,
        roleHierarchy: users.roleHierarchy,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const isAdminUser =
      dbUser?.role === 'super_admin' ||
      dbUser?.role === 'admin' ||
      dbUser?.roleHierarchy === 'system_super_admin' ||
      dbUser?.roleHierarchy === 'system_admin';

    if (!isAdminUser) {
      console.log('[Support API POST] User is not admin, denying access');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createTicketSchema.parse(body);

    // Calculate SLA times (example: 1 hour for urgent, 4 hours for high, 1 day for normal/low)
    const now = new Date();
    let slaResponseMinutes = 60 * 24; // 1 day default
    if (validated.priority === 'urgent')
      slaResponseMinutes = 60; // 1 hour
    else if (validated.priority === 'high') slaResponseMinutes = 60 * 4; // 4 hours

    const slaResponseBy = new Date(now.getTime() + slaResponseMinutes * 60000);
    const slaResolutionBy = new Date(
      now.getTime() + slaResponseMinutes * 2 * 60000
    );

    // Create ticket
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userId: user.id,
        subject: validated.subject,
        description: validated.description,
        category: validated.category || null,
        priority: validated.priority,
        status: 'new',
        slaResponseBy,
        slaResolutionBy,
      })
      .returning();

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('[Support API] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database using Drizzle
    const [dbUser] = await db
      .select({
        role: users.role,
        roleHierarchy: users.roleHierarchy,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    console.log('[Support API] User role check:', {
      email: user.email,
      role: dbUser?.role,
      role_hierarchy: dbUser?.roleHierarchy,
    });

    const isAdminUser =
      dbUser?.role === 'super_admin' ||
      dbUser?.role === 'admin' ||
      dbUser?.roleHierarchy === 'system_super_admin' ||
      dbUser?.roleHierarchy === 'system_admin';

    if (!isAdminUser) {
      console.log('[Support API] User is not admin, denying access');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get tickets with assignee info using LEFT JOIN
    const ticketsWithAssignees = await db
      .select({
        ticket: supportTickets,
        assignee: users,
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.assignedTo, users.id))
      .orderBy(desc(supportTickets.createdAt))
      .limit(100);

    // Calculate stats from all tickets
    const allTickets = ticketsWithAssignees.map((t) => t.ticket);
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

    return NextResponse.json({ tickets: ticketsWithAssignees, stats });
  } catch (error) {
    console.error('[Support API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
