import { NextRequest, NextResponse } from 'next/server';
import { resetStuckSyncs } from '@/lib/sync/sync-orchestrator';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';

/**
 * Health Check API for Sync System
 * - Resets stuck syncs (accounts stuck in "syncing" state for > 10 minutes)
 * - Returns sync statistics
 * 
 * Call this periodically (e.g., on dashboard load) to ensure system health
 */
export async function GET() {
  try {
    // Reset any stuck syncs
    const resetCount = await resetStuckSyncs();

    // Get current sync stats
    const accounts = await db.select().from(emailAccounts);

    const stats = {
      total: accounts.length,
      syncing: accounts.filter((a) => a.syncStatus === 'syncing').length,
      idle: accounts.filter((a) => a.syncStatus === 'idle').length,
      error: accounts.filter((a) => a.status === 'error').length,
      active: accounts.filter((a) => a.status === 'active').length,
      stuckReset: resetCount,
    };

    const message =
      resetCount > 0
        ? `Reset ${resetCount} stuck sync(s)`
        : 'All syncs healthy';

    console.log(`✅ Health check complete: ${message}`, stats);

    return NextResponse.json({
      healthy: true,
      message,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);

    return NextResponse.json(
      {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

