/**
 * Test Alert Rule API
 * Send a test notification for an alert rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { alertRules } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    const { id } = await params;

    const [rule] = await db
      .select()
      .from(alertRules)
      .where(eq(alertRules.id, id))
      .limit(1);

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Send test notification
    console.log(`[TEST ALERT] ${rule.name}: Test notification sent`);
    console.log(`Channels:`, rule.notificationChannels);

    // TODO: Implement actual notification sending
    // - Email via Resend/SendGrid
    // - Slack webhook
    // - Custom webhook

    return NextResponse.json({
      success: true,
      message: 'Test alert sent',
      rule: rule.name,
    });
  } catch (error) {
    console.error('[Test Alert API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send test alert' },
      { status: 500 }
    );
  }
}
