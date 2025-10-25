import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailSignatures, emailAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/email/signature
 * Fetch the user's default email signature
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's primary/first active email account
    const userAccount = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.userId, user.id),
    });

    if (!userAccount) {
      return NextResponse.json({
        signature: null,
        message: 'No email account found',
      });
    }

    // Get signature for this account
    const signature = await db.query.emailSignatures.findFirst({
      where: and(
        eq(emailSignatures.userId, user.id),
        eq(emailSignatures.accountId, userAccount.id),
        eq(emailSignatures.isDefault, true)
      ),
    });

    if (!signature || !signature.htmlContent) {
      // Return a default signature if none exists
      return NextResponse.json({
        signature: `<p>Best regards,<br>${user.email}</p>`,
      });
    }

    return NextResponse.json({
      signature: signature.htmlContent,
    });
  } catch (error) {
    console.error('Error fetching signature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signature' },
      { status: 500 }
    );
  }
}
