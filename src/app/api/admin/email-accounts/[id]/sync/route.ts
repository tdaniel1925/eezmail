/**
 * Manual Email Account Sync API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/inngest/client';
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

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: accountId } = await params;

    // Trigger sync via Inngest
    await inngest.send({
      name: 'email/sync.requested',
      data: {
        accountId,
        triggeredBy: user.id,
        manual: true,
      },
    });

    // Log audit action
    await logAuditAction({
      actorId: user.id,
      actorType: 'admin',
      action: 'email_account.sync_triggered',
      resourceType: 'email_account',
      resourceId: accountId,
      riskLevel: 'low',
    });

    return NextResponse.json({
      success: true,
      message: 'Sync triggered',
    });
  } catch (error) {
    console.error('[Email Sync API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    );
  }
}
