/**
 * Start Impersonation API Route
 * POST /api/admin/impersonate/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startImpersonation } from '@/lib/admin/impersonation';
import { z } from 'zod';

const startImpersonationSchema = z.object({
  targetUserId: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  readOnly: z.boolean().optional().default(false),
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

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = startImpersonationSchema.parse(body);

    // Start impersonation session
    const context = await startImpersonation({
      adminId: user.id,
      targetUserId: validatedData.targetUserId,
      reason: validatedData.reason,
      readOnly: validatedData.readOnly,
    });

    // Return session token and context
    return NextResponse.json({
      success: true,
      sessionToken: context.session.sessionToken,
      session: {
        id: context.session.id,
        targetUser: context.targetUser,
        admin: context.admin,
        startedAt: context.session.startedAt,
        readOnly: context.session.readOnly,
      },
    });
  } catch (error) {
    console.error('[Impersonation Start] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    );
  }
}
