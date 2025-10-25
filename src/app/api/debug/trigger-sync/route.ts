import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

/**
 * DEBUG: Trigger sync and return immediate confirmation
 * GET /api/debug/trigger-sync?accountId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId =
      searchParams.get('accountId') || '26ddbb0d-12f4-422b-8a33-fd1e8072e33c';
    const userId =
      searchParams.get('userId') || 'bc958faa-efe4-4136-9882-789d9b161c6a';

    console.log(`🔄 Triggering incremental sync...`);

    // Trigger sync
    const { ids } = await inngest.send({
      name: 'email/microsoft.sync',
      data: {
        accountId,
        userId,
        syncMode: 'incremental',
        trigger: 'debug-manual',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sync triggered successfully!',
      eventId: ids[0],
      instructions: {
        watchLive: 'http://localhost:8288',
        checkProgress: 'http://localhost:3000/api/debug/email-folders',
        checkSent: 'http://localhost:3000/dashboard/sent',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
