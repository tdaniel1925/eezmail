import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncAurinkoEmails } from '@/lib/aurinko/sync-service';

/**
 * POST /api/aurinko/sync
 * Manually trigger Aurinko email sync for an account
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const result = await syncAurinkoEmails(accountId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      emailCount: result.emailCount,
      message: `Successfully synced ${result.emailCount} emails`,
    });
  } catch (error) {
    console.error('Error in Aurinko sync API:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
