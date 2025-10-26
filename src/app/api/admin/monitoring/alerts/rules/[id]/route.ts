/**
 * Alert Rule Update/Delete API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { alertRules } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logAuditAction } from '@/lib/audit/logger';

const updateRuleSchema = z.object({
  name: z.string().min(3).optional(),
  threshold: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  enabled: z.boolean().optional(),
  notificationChannels: z.record(z.unknown()).optional(),
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
    const validated = updateRuleSchema.parse(body);

    const [updated] = await db
      .update(alertRules)
      .set(validated)
      .where(eq(alertRules.id, id))
      .returning();

    await logAuditAction({
      actorId: user.id,
      actorType: 'admin',
      action: 'alert_rule.updated',
      resourceType: 'alert_rule',
      resourceId: id,
      changes: validated,
      riskLevel: 'medium',
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Alert Rule API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;

    await db.delete(alertRules).where(eq(alertRules.id, id));

    await logAuditAction({
      actorId: user.id,
      actorType: 'admin',
      action: 'alert_rule.deleted',
      resourceType: 'alert_rule',
      resourceId: id,
      riskLevel: 'high',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Alert Rule API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert rule' },
      { status: 500 }
    );
  }
}
