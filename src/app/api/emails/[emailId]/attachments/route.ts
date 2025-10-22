import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAttachments, emails } from '@/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
): Promise<NextResponse> {
  try {
    const { emailId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get email and verify ownership
    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
      with: {
        account: true,
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Verify user owns this email
    if (email.account.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch attachments for this email
    // Exclude inline attachments (signatures, logos, embedded images)
    const attachments = await db.query.emailAttachments.findMany({
      where: and(
        eq(emailAttachments.emailId, emailId),
        or(
          eq(emailAttachments.isInline, false),
          isNull(emailAttachments.isInline)
        )
      ),
      orderBy: (attachments, { asc }) => [asc(attachments.createdAt)],
    });

    return NextResponse.json({
      success: true,
      attachments: attachments.map((att) => ({
        id: att.id,
        filename: att.filename,
        originalFilename: att.originalFilename,
        contentType: att.contentType,
        size: att.size,
        isInline: att.isInline,
        downloadStatus: att.downloadStatus,
        storageUrl: att.storageUrl,
        downloadCount: att.downloadCount,
        lastDownloadedAt: att.lastDownloadedAt,
        createdAt: att.createdAt,
      })),
    });
  } catch (error) {
    console.error('Fetch email attachments error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
