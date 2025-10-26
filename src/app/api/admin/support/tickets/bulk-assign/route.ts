import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bulkAutoAssign, AssignmentStrategy } from '@/lib/support/auto-assign';
import { logAuditAction } from '@/lib/audit/logger';

export async function POST(request: NextRequest) {
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

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      ticketIds,
      strategy,
    }: { ticketIds: string[]; strategy?: AssignmentStrategy } = body;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json(
        { error: 'ticketIds array is required' },
        { status: 400 }
      );
    }

    const result = await bulkAutoAssign(
      ticketIds,
      strategy || { type: 'load_balance' }
    );

    // Log to audit
    await logAuditAction({
      actorId: user.id,
      actorType: 'user',
      actorEmail: user.email!,
      action: 'ticket.bulk_auto_assigned',
      resourceType: 'support_ticket',
      resourceId: null,
      metadata: {
        ticketCount: ticketIds.length,
        successful: result.successful,
        failed: result.failed,
        strategy: strategy?.type || 'load_balance',
      },
      riskLevel: 'medium',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bulk auto-assign error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk auto-assign tickets' },
      { status: 500 }
    );
  }
}
