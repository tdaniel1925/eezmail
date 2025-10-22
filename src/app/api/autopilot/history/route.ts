import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/autopilot/history - Get execution history
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Fetch executions with rule and email details
    const { data: executions, error, count } = await supabase
      .from('autopilot_executions')
      .select('*, autopilot_rules(name), emails(subject, from_address)', { count: 'exact' })
      .eq('autopilot_rules.user_id', user.id)
      .order('executed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching execution history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch execution history' },
        { status: 500 }
      );
    }

    // Format executions
    const formattedExecutions = executions?.map((exec: any) => ({
      id: exec.id,
      ruleId: exec.rule_id,
      ruleName: exec.autopilot_rules?.name || 'Unknown Rule',
      emailId: exec.email_id,
      emailSubject: exec.emails?.subject || 'No subject',
      emailFrom: exec.emails?.from_address?.email || exec.emails?.from_address || 'Unknown',
      action: exec.action,
      success: exec.success,
      userCorrection: exec.user_correction,
      executedAt: exec.executed_at,
    }));

    const hasMore = (count || 0) > offset + limit;

    return NextResponse.json({
      executions: formattedExecutions,
      hasMore,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in autopilot history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


