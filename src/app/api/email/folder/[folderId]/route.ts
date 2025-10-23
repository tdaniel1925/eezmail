import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { customFolders, emails, emailAccounts } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(25),
  offset: z.coerce.number().min(0).default(0),
});

interface RouteContext {
  params: Promise<{
    folderId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Await params
    const { folderId } = await context.params;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const validatedData = querySchema.parse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    // Fetch the folder and verify ownership
    const [folder] = await db
      .select()
      .from(customFolders)
      .where(
        and(eq(customFolders.id, folderId), eq(customFolders.userId, user.id))
      )
      .limit(1);

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        folder,
        emails: [],
        total: 0,
        hasMore: false,
      });
    }

    const accountIds = userAccounts.map((account) => account.id);

    // Fetch emails in this folder
    const folderEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.customFolderId, folderId)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(validatedData.limit)
      .offset(validatedData.offset);

    // Get total count for pagination
    const totalCount = await db
      .select()
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.customFolderId, folderId)
        )
      );

    const total = totalCount.length;
    const hasMore = validatedData.offset + validatedData.limit < total;

    return NextResponse.json({
      success: true,
      folder,
      emails: folderEmails,
      total,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching folder emails:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch folder emails' },
      { status: 500 }
    );
  }
}

