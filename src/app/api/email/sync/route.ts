import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triggerSync, getSyncStatus } from '@/lib/sync/sync-orchestrator';

/**
 * Manually trigger email sync
 * POST /api/email/sync
 * Body: { accountId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 API sync request for account: ${accountId}`);

    // Trigger sync via orchestrator
    const syncResult = await triggerSync({
      accountId,
      userId: user.id,
      trigger: 'manual',
    });

    if (!syncResult.success) {
      return NextResponse.json(
        { error: syncResult.error || 'Failed to start sync' },
        { status: 400 }
      );
    }

    console.log(`✅ Sync triggered via API - Run ID: ${syncResult.runId}`);

    return NextResponse.json({
      success: true,
      message: 'Sync started successfully',
      runId: syncResult.runId,
    });
  } catch (error) {
    console.error('❌ Error in sync API:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to trigger sync',
      },
      { status: 500 }
    );
  }
}

/**
 * Get sync status for an account
 * GET /api/email/sync?accountId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Get status via orchestrator
    const statusResult = await getSyncStatus(accountId, user.id);

    if (!statusResult.success) {
      return NextResponse.json(
        { error: statusResult.error || 'Failed to get status' },
        { status: 404 }
      );
    }

    // Return the full result (with success flag and data)
    return NextResponse.json(statusResult);
  } catch (error) {
    console.error('❌ Error getting sync status:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to get sync status',
      },
      { status: 500 }
    );
  }
}
