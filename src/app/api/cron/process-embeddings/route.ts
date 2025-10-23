/**
 * Cron Job: Process Embedding Queue
 * Runs every 30 seconds to generate embeddings for queued emails
 * Non-blocking background processing
 */

import { NextResponse } from 'next/server';
import { processEmbeddingQueue } from '@/lib/rag/embedding-queue';

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

    console.log('🚀 [Cron] Starting embedding queue processing...');

    // Process up to 10 embeddings per run
    const result = await processEmbeddingQueue(10);

    console.log(
      `✅ [Cron] Embedding queue processing complete:`,
      result
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [Cron] Error processing embedding queue:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

