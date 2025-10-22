import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db/client';
import { emails } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// Input validation schema
const sentEmailsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
    };

    // Validate params
    const validationResult = sentEmailsSchema.safeParse(rawParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validationResult.error },
        { status: 400 }
      );
    }

    const { limit, offset } = validationResult.data;

    console.log(
      `📤 Fetching sent emails for user: ${user.id}, limit: ${limit}, offset: ${offset}`
    );

    // Query sent emails
    const sentEmails = await db.query.emails.findMany({
      where: (emails, { eq, and, or }) =>
        and(
          // Get emails from user's accounts
          eq(emails.userId, user.id),
          // Filter by sent folder
          or(
            eq(emails.folderName, 'sent'),
            eq(emails.folderName, 'sentitems'),
            eq(emails.folderName, 'sent items'),
            eq(emails.folderName, 'sent mail')
          )
        ),
      orderBy: (emails, { desc }) => [desc(emails.receivedAt)],
      limit,
      offset,
    });

    console.log(`✅ Found ${sentEmails.length} sent emails`);

    return NextResponse.json({
      success: true,
      emails: sentEmails,
      count: sentEmails.length,
    });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
