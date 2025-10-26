import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { emailAccounts } from '@/db/schema';
import { inArray, eq} from 'drizzle-orm';
import { inngest } from '@/inngest/client';

/**
 * POST /api/admin/email-accounts/bulk-sync
 * Trigger bulk sync for multiple email accounts
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const accountIds: string[] = body.accountIds || [];

    if (accountIds.length === 0) {
      return NextResponse.json(
        { error: 'No account IDs provided' },
        { status: 400 }
      );
    }

    // Get account details
    const accounts = await db
      .select()
      .from(emailAccounts)
      .where(inArray(emailAccounts.id, accountIds));

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ accountId: string; error: string }>,
    };

    // Trigger sync for each account
    for (const account of accounts) {
      try {
        let eventName: string;
        
        if (account.provider === 'microsoft') {
          eventName = 'email/microsoft.sync';
        } else if (account.provider === 'google' || account.provider === 'gmail') {
          eventName = 'email/sync.gmail';
        } else if (account.provider === 'imap' || account.provider === 'yahoo') {
          eventName = 'email/sync.imap';
        } else {
          results.failed++;
          results.errors.push({
            accountId: account.id,
            error: `Unsupported provider: ${account.provider}`,
          });
          continue;
        }

        // Trigger Inngest function
        await inngest.send({
          name: eventName,
          data: {
            accountId: account.id,
            userId: account.userId,
          },
        });

        // Update sync status
        await db
          .update(emailAccounts)
          .set({
            syncStatus: 'syncing',
            syncProgress: 0,
          } as any)
          .where(eq(emailAccounts.id, account.id));

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          accountId: account.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error triggering bulk sync:', error);
    return NextResponse.json(
      { error: 'Failed to trigger bulk sync' },
      { status: 500 }
    );
  }
}

