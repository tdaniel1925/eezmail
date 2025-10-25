import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/inngest/client';

/**
 * DEBUG: Manually trigger sync for sent folder
 * POST /api/debug/sync-sent-folder
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

    console.log(`🔄 Manually triggering sync for account: ${accountId}`);

    // Trigger a fresh sync via Inngest
    const { ids } = await inngest.send({
      name: 'email/microsoft.sync',
      data: {
        accountId,
        userId: user.id,
        syncMode: 'incremental', // Use incremental to pick up where it left off
        trigger: 'manual-sent-folder-fix',
      },
    });

    console.log(`✅ Sync triggered - Event ID: ${ids[0]}`);

    return NextResponse.json({
      success: true,
      message: 'Sync triggered successfully',
      eventId: ids[0],
      note: 'The sync will process all folders including the sent folder. Check progress at /api/debug/email-folders',
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
