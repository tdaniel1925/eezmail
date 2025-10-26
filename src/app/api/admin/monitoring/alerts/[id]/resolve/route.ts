/**
 * Alert Resolution API Endpoint
 * Mark alerts as resolved
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveAlert } from '@/lib/monitoring/metrics';
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

    // Resolve the alert
    await resolveAlert(id);

    // Log audit action
    await logAuditAction({
      actorId: user.id,
      actorType: 'admin',
      action: 'alert.resolved',
      resourceType: 'alert_event',
      resourceId: id,
      riskLevel: 'low',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Alert API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}
