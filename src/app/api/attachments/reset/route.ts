import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAttachments, emailAccounts } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email accounts
    const accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: 'No accounts found',
      });
    }

    const accountIds = accounts.map((acc) => acc.id);

    // Get all emails for user's accounts
    const userAttachments = await db
      .select({ id: emailAttachments.id })
      .from(emailAttachments)
      .where(inArray(emailAttachments.accountId, accountIds));

    const attachmentIds = userAttachments.map((att) => att.id);

    // Delete all attachment metadata
    if (attachmentIds.length > 0) {
      await db
        .delete(emailAttachments)
        .where(inArray(emailAttachments.id, attachmentIds));
    }

    // Note: Storage files will remain in Supabase Storage
    // You could optionally delete them from storage here if needed

    console.log(
      `✅ Reset: Deleted ${attachmentIds.length} attachment records for user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      deleted: attachmentIds.length,
      message:
        'All attachment metadata deleted. Next sync will re-process attachments.',
    });
  } catch (error) {
    console.error('Error resetting attachments:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}


