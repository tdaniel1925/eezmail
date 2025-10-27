import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { alertRules } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all alert rules
    const rules = await db
      .select()
      .from(alertRules)
      .orderBy(desc(alertRules.createdAt));

    const stats = {
      total: rules.length,
      enabled: rules.filter((r) => r.enabled).length,
      critical: rules.filter((r) => r.severity === 'critical').length,
      triggered: rules.filter((r) => r.lastTriggeredAt !== null).length,
    };

    return NextResponse.json({ rules, stats });
  } catch (error) {
    console.error('[Admin Monitoring Alerts API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rules' },
      { status: 500 }
    );
  }
}
