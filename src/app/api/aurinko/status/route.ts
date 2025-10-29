import { NextResponse } from 'next/server';
import { getAurinkoAccountStatus } from '@/lib/aurinko/sync-service';

/**
 * GET /api/aurinko/status?accountId=xxx
 * Get status of Aurinko account
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const result = await getAurinkoAccountStatus(accountId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting Aurinko status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
