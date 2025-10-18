import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events (SSE) endpoint for real-time sync progress
 * Streams sync status updates every second
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId');

  if (!accountId) {
    return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
  }

  // Verify user authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify account belongs to user
  const account = await db.query.emailAccounts.findFirst({
    where: eq(emailAccounts.id, accountId),
  });

  if (!account || account.userId !== user.id) {
    return NextResponse.json(
      { error: 'Account not found or unauthorized' },
      { status: 403 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const initMessage = `data: ${JSON.stringify({ type: 'connected', accountId })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      // Send updates every second
      const interval = setInterval(async () => {
        try {
          const account = await db.query.emailAccounts.findFirst({
            where: eq(emailAccounts.id, accountId),
          });

          if (!account) {
            clearInterval(interval);
            controller.close();
            return;
          }

          const data = {
            type: 'update',
            accountId: account.id,
            email: account.emailAddress,
            status: account.syncStatus || 'idle',
            progress: account.syncProgress || 0,
            total: account.syncTotal || 0,
            lastSyncAt: account.lastSyncAt?.toISOString(),
            syncUpdatedAt: account.syncUpdatedAt?.toISOString(),
            error: account.lastSyncError,
            priority: account.syncPriority || 'normal',
            updatedAt: new Date().toISOString(),
          };

          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('SSE error:', error);
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          })}\n\n`;
          controller.enqueue(encoder.encode(errorMessage));
        }
      }, 1000); // Update every second

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
        console.log(`SSE connection closed for account: ${accountId}`);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in Nginx
    },
  });
}






