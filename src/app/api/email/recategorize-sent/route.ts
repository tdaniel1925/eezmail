import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';

/**
 * Recategorize sent emails that were incorrectly marked as 'archived'
 * POST /api/email/recategorize-sent
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔄 Recategorizing sent emails for user: ${user.id}`);

    // Update all emails in sent folders that are marked as 'archived' to 'inbox'
    const result = await db
      .update(emails)
      .set({
        emailCategory: 'inbox',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(emails.userId, user.id),
          or(
            eq(emails.folderName, 'sent'),
            eq(emails.folderName, 'sentitems'),
            eq(emails.folderName, 'sent items'),
            eq(emails.folderName, 'sent mail')
          ),
          eq(emails.emailCategory, 'archived')
        )
      );

    console.log(`✅ Recategorized sent emails`);

    return NextResponse.json({
      success: true,
      message: 'Sent emails recategorized successfully',
    });
  } catch (error) {
    console.error('Error recategorizing sent emails:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
