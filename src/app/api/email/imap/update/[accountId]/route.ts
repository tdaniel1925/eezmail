import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = await params;
    const body = await req.json();

    const {
      email,
      password,
      host,
      port,
      secure,
      smtpHost,
      smtpPort,
      smtpSecure,
    } = body;

    // Validate required fields
    if (!email || !host || !smtpHost) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      emailAddress: email,
      imapHost: host,
      imapPort: port || 993,
      imapUseSsl: secure !== false,
      imapUsername: email,
      smtpHost: smtpHost,
      smtpPort: smtpPort || 465,
      smtpUsername: email,
      smtpUseSsl: smtpSecure !== false,
      updatedAt: new Date(),
    };

    // Only update password if provided (user changed it)
    if (password && password.trim() !== '') {
      updateData.accessToken = password; // Store as accessToken for IMAP
      updateData.smtpPassword = password;
    }

    // Update account
    await db
      .update(emailAccounts)
      .set(updateData)
      .where(
        and(eq(emailAccounts.id, accountId), eq(emailAccounts.userId, user.id))
      );

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully',
    });
  } catch (error) {
    console.error('Error updating IMAP account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update account' },
      { status: 500 }
    );
  }
}


