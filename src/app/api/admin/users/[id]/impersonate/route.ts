import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startImpersonation } from '@/lib/admin/impersonation';

/**
 * POST /api/admin/users/[id]/impersonate
 * Start impersonating a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const body = await request.json();
    const reason = body.reason || 'Support assistance';

    // Cannot impersonate another admin
    const { data: targetUser } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', targetUserId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    if (targetUser.role === 'super_admin' || targetUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot impersonate admin users' },
        { status: 403 }
      );
    }

    // Start impersonation
    const result = await startImpersonation(user.id, targetUserId, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: result.session,
      redirectUrl: '/dashboard',
    });
  } catch (error) {
    console.error('Error starting impersonation:', error);
    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    );
  }
}

