/**
 * Cron Job: Process Contact Timeline Queue
 * Runs every 30 seconds to log email events to contact timelines
 * Non-blocking background processing
 */

import { NextResponse } from 'next/server';
import { processContactTimelineQueue } from '@/lib/contacts/timeline-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max

export async function GET(request: Request) {
  try {
    // Verify cron secret (optional but recommended for security)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🚀 [Cron] Starting contact timeline queue processing...');

    // Process up to 20 timeline events per run
    const result = await processContactTimelineQueue(20);

    console.log(
      `✅ [Cron] Contact timeline queue processing complete:`,
      result
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [Cron] Error processing contact timeline queue:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

