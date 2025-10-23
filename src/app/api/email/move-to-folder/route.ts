import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, customFolders, emailAccounts } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';

const requestSchema = z.object({
  emailId: z.string().uuid(),
  folderId: z.string().uuid().nullable(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { emailId, folderId } = requestSchema.parse(body);

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return NextResponse.json(
        { error: 'No email accounts found' },
        { status: 404 }
      );
    }

    const accountIds = userAccounts.map((account) => account.id);

    // Verify email belongs to user
    const [email] = await db
      .select()
      .from(emails)
      .where(
        and(eq(emails.id, emailId), inArray(emails.accountId, accountIds))
      )
      .limit(1);

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // If folderId is provided, verify folder belongs to user
    if (folderId) {
      const [folder] = await db
        .select()
        .from(customFolders)
        .where(
          and(eq(customFolders.id, folderId), eq(customFolders.userId, user.id))
        )
        .limit(1);

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        );
      }
    }

    // Move email to folder (or remove from folder if folderId is null)
    await db
      .update(emails)
      .set({
        customFolderId: folderId,
        updatedAt: new Date(),
      })
      .where(eq(emails.id, emailId));

    return NextResponse.json({
      success: true,
      message: folderId
        ? 'Email moved to folder successfully'
        : 'Email removed from folder successfully',
    });
  } catch (error) {
    console.error('Error moving email to folder:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to move email to folder' },
      { status: 500 }
    );
  }
}

