import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  autoAssignTicket,
  bulkAutoAssign,
  AssignmentStrategy,
} from '@/lib/support/auto-assign';
import { logAuditAction } from '@/lib/audit/logger';

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

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !userData ||
      !['admin', 'super_admin', 'support_agent'].includes(userData.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: ticketId } = await params;
    const body = await request.json();
    const strategy: AssignmentStrategy = body.strategy || {
      type: 'round_robin',
    };

    const result = await autoAssignTicket(ticketId, strategy);

    if (result.success) {
      // Log to audit
      await logAuditAction({
        actorId: user.id,
        actorType: 'user',
        actorEmail: user.email!,
        action: 'ticket.auto_assigned',
        resourceType: 'support_ticket',
        resourceId: ticketId,
        metadata: {
          assignedTo: result.assignedTo,
          strategy: strategy.type,
          reason: result.reason,
        },
        riskLevel: 'low',
      });

      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
  } catch (error) {
    console.error('Auto-assign error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-assign ticket' },
      { status: 500 }
    );
  }
}
