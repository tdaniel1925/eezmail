import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAttachments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
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

    // Delete from storage if exists
    if (attachment.storageKey) {
      const { error: storageError } = await supabase.storage
        .from('email-attachments')
        .remove([attachment.storageKey]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue anyway - we'll delete the database record
      }
    }

    // Delete from database
    await db
      .delete(emailAttachments)
      .where(eq(emailAttachments.id, attachmentId));

    return NextResponse.json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}


