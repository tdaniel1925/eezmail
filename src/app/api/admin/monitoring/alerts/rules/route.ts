/**
 * Alert Rules API Endpoint
 * Create and list alert rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { alertRules } from '@/db/schema';
import { z } from 'zod';
import { logAuditAction } from '@/lib/audit/logger';

const createRuleSchema = z.object({
  name: z.string().min(3),
  metric: z.string(),
  operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
  threshold: z.string(),
  durationMinutes: z.number().min(1).optional(),
  severity: z.enum(['info', 'warning', 'critical']),
  notificationChannels: z.record(z.unknown()),
  enabled: z.boolean().default(true),
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

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createRuleSchema.parse(body);

    const [rule] = await db
      .insert(alertRules)
      .values({
        name: validated.name,
        metric: validated.metric,
        operator: validated.operator,
        threshold: validated.threshold,
        durationMinutes: validated.durationMinutes || 5,
        severity: validated.severity,
        notificationChannels: validated.notificationChannels,
        enabled: validated.enabled,
      })
      .returning();

    await logAuditAction({
      actorId: user.id,
      actorType: 'admin',
      action: 'alert_rule.created',
      resourceType: 'alert_rule',
      resourceId: rule.id,
      metadata: { ruleName: rule.name },
      riskLevel: 'medium',
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('[Alert Rules API] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    );
  }
}
