import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ruleSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean().optional().default(true),
  conditions: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    subject: z.string().optional(),
    body: z.string().optional(),
    category: z.string().optional(),
    hasAttachment: z.boolean().optional(),
    priority: z.enum(['high', 'normal', 'low']).optional(),
  }),
  actions: z.object({
    moveToFolder: z.string().optional(),
    addLabel: z.string().optional(),
    markAs: z.enum(['read', 'unread', 'important', 'archived']).optional(),
    archive: z.boolean().optional(),
    delete: z.boolean().optional(),
    forward: z.string().email().optional(),
  }),
});

// GET /api/autopilot/rules - List all rules
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch rules from database
    const { data: rules, error } = await supabase
      .from('autopilot_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rules:', error);
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }

    // Calculate stats
    const totalRules = rules?.length || 0;
    const activeRules = rules?.filter((r) => r.enabled).length || 0;

    // Fetch execution stats
    const { data: executions } = await supabase
      .from('autopilot_executions')
      .select('success')
      .in(
        'rule_id',
        rules?.map((r) => r.id) || []
      );

    const totalExecutions = executions?.length || 0;
    const successfulExecutions = executions?.filter((e) => e.success).length || 0;
    const successRate =
      totalExecutions > 0
        ? Math.round((successfulExecutions / totalExecutions) * 100)
        : 0;

    // Format rules with execution counts
    const formattedRules = rules?.map((rule) => {
      const ruleExecutions = executions?.filter((e: any) => e.rule_id === rule.id) || [];
      const ruleSuccesses = ruleExecutions.filter((e: any) => e.success).length;

      return {
        id: rule.id,
        name: rule.name,
        enabled: rule.enabled,
        conditions: rule.conditions,
        actions: rule.actions,
        executionCount: ruleExecutions.length,
        successRate:
          ruleExecutions.length > 0
            ? Math.round((ruleSuccesses / ruleExecutions.length) * 100)
            : 0,
        createdAt: rule.created_at,
      };
    });

    return NextResponse.json({
      rules: formattedRules,
      stats: {
        totalRules,
        activeRules,
        totalExecutions,
        successRate,
      },
    });
  } catch (error) {
    console.error('Error in autopilot rules API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/autopilot/rules - Create new rule
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ruleSchema.parse(body);

    // Insert into database
    const { data: rule, error } = await supabase
      .from('autopilot_rules')
      .insert({
        user_id: user.id,
        name: validatedData.name,
        enabled: validatedData.enabled,
        conditions: validatedData.conditions,
        actions: validatedData.actions,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rule:', error);
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('Error in autopilot rules API:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


