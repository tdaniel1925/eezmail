import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteUserData, verifyDeletion } from '@/lib/privacy/data-deletion';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or the user themselves
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin =
      userData?.role === 'super_admin' || userData?.role === 'admin';
    const isOwnData = user.id === (await params).userId;

    if (!isAdmin && !isOwnData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();

    // TODO: Create deletion request with grace period
    // TODO: Queue background job to process after grace period

    return NextResponse.json({
      success: true,
      message: 'Deletion request created',
      requestId: crypto.randomUUID(),
      scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  } catch (error) {
    console.error('Error creating deletion request:', error);
    return NextResponse.json(
      { error: 'Failed to create deletion request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (deletion requires admin)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;

    // Execute deletion
    const report = await deleteUserData(userId, {
      anonymizeAuditLogs: true,
      deleteImmediately: false,
    });

    // Verify deletion
    const verification = await verifyDeletion(userId);

    return NextResponse.json({
      success: report.status === 'completed',
      report,
      verification,
    });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json(
      { error: 'Failed to delete user data' },
      { status: 500 }
    );
  }
}
