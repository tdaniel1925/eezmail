import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { customFolders, emails } from '@/db/schema';
import { eq } from 'drizzle-orm';

// DELETE - Delete a custom folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify folder belongs to user
    const folder = await db.query.customFolders.findFirst({
      where: eq(customFolders.id, id),
    });

    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      );
    }

    if (folder.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Move emails in this folder to inbox (set customFolderId to null)
    await db
      .update(emails)
      .set({ customFolderId: null, updatedAt: new Date() })
      .where(eq(emails.customFolderId, id));

    // Delete the folder
    await db.delete(customFolders).where(eq(customFolders.id, id));

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully',
    });
  } catch (error) {
    console.error('[Custom Folders API] Error deleting folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}

