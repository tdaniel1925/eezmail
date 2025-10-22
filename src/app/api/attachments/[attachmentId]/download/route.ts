import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAttachments, emailAccounts, emails } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { downloadAndStore } from '@/lib/email/attachment-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
): Promise<NextResponse> {
  try {
    const { attachmentId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get attachment metadata and verify ownership
    const attachment = await db.query.emailAttachments.findFirst({
      where: eq(emailAttachments.id, attachmentId),
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Verify user owns this attachment
    if (attachment.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already downloaded
    if (attachment.downloadStatus === 'completed' && attachment.storageUrl) {
      console.log('✅ Attachment already downloaded, fetching from storage');

      // Fetch from Supabase Storage
      const { data: fileData, error: storageError } = await supabase.storage
        .from('email-attachments')
        .download(attachment.storageKey!);

      if (storageError || !fileData) {
        console.error('Storage download error:', storageError);
        return NextResponse.json(
          { error: 'Failed to download from storage' },
          { status: 500 }
        );
      }

      // Convert blob to buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Update download tracking
      await db
        .update(emailAttachments)
        .set({
          downloadCount: (attachment.downloadCount || 0) + 1,
          lastDownloadedAt: new Date(),
        })
        .where(eq(emailAttachments.id, attachmentId));

      // Return file
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': attachment.contentType,
          'Content-Disposition': `attachment; filename="${attachment.originalFilename}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    // Need to download from provider first
    console.log('📥 Downloading attachment from provider...');

    // Get email and account info
    const email = await db.query.emails.findFirst({
      where: eq(emails.id, attachment.emailId),
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, attachment.accountId),
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Prepare download params
    const downloadParams: any = {
      attachmentId: attachmentId,
      provider: account.provider as 'gmail' | 'outlook' | 'imap',
      messageId: email.messageId,
      providerAttachmentId: attachment.providerAttachmentId,
    };

    // Add provider-specific auth
    if (account.provider === 'gmail' || account.provider === 'outlook') {
      downloadParams.accessToken = account.accessToken;
    } else if (account.provider === 'imap') {
      downloadParams.imapConfig = {
        host: account.imapHost!,
        port: account.imapPort!,
        user: account.imapUsername || account.emailAddress,
        password: account.accessToken!, // Password stored in accessToken
        tls: account.imapUseSsl || true,
      };
    }

    // Download and store
    const result = await downloadAndStore(downloadParams);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Download failed' },
        { status: 500 }
      );
    }

    // Now fetch the file from storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('email-attachments')
      .download(
        `attachments/${attachment.userId}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${attachment.filename}`
      );

    if (storageError || !fileData) {
      console.error('Storage download error after upload:', storageError);
      return NextResponse.json(
        { error: 'Failed to download from storage' },
        { status: 500 }
      );
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Update download tracking
    await db
      .update(emailAttachments)
      .set({
        downloadCount: (attachment.downloadCount || 0) + 1,
        lastDownloadedAt: new Date(),
      })
      .where(eq(emailAttachments.id, attachmentId));

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.contentType,
        'Content-Disposition': `attachment; filename="${attachment.originalFilename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download attachment error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
