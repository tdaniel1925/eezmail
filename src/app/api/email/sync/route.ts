import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for email sync request
const syncEmailSchema = z.object({
  accountId: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  unreadOnly: z.boolean().optional().default(false),
  folderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = syncEmailSchema.parse(body);

    // Get user's email account
    let account;
    if (validatedData.accountId) {
      account = await db.query.emailAccounts.findFirst({
        where: eq(emailAccounts.id, validatedData.accountId),
      });
    } else {
      const accounts = await db.query.emailAccounts.findMany({
        where: eq(emailAccounts.userId, user.id),
      });
      account = accounts.find((a) => a.status === 'active');
    }

    if (!account) {
      return NextResponse.json(
        { error: 'No active email account found' },
        { status: 400 }
      );
    }

    // TODO: Implement actual email sync via provider (Nylas/Gmail/Microsoft)
    // For now, return mock sync results
    console.log('Syncing emails:', {
      accountId: account.id,
      limit: validatedData.limit,
      offset: validatedData.offset,
      unreadOnly: validatedData.unreadOnly,
      folderId: validatedData.folderId,
    });

    // Mock sync results
    const syncResults = {
      success: true,
      synced: Math.floor(Math.random() * 10) + 1, // Random number of emails synced
      total: validatedData.limit,
      nextCursor: validatedData.offset + validatedData.limit,
      hasMore: Math.random() > 0.5, // Random boolean
    };

    return NextResponse.json(syncResults);
  } catch (error) {
    console.error('Error syncing emails:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync emails' },
      { status: 500 }
    );
  }
}
