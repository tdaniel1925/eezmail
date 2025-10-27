import { NextResponse } from 'next/server';
import { calculateStorageUsed, getStorageQuota } from '@/lib/storage/calculate';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get storage used and quota in parallel
    const [usedResult, quotaResult] = await Promise.all([
      calculateStorageUsed(user.id),
      getStorageQuota(user.id),
    ]);

    if (!usedResult.success || !quotaResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            usedResult.error || quotaResult.error || 'Failed to fetch storage',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      storage: {
        used: usedResult.bytesUsed || 0,
        total: quotaResult.bytesQuota || 15 * 1024 * 1024 * 1024, // Default 15GB
        usedFormatted: usedResult.formatted || '0 Bytes',
        totalFormatted: quotaResult.formatted || '15 GB',
        tier: quotaResult.tier || 'free',
      },
    });
  } catch (error) {
    console.error('Error fetching storage usage:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
