import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { customFolders } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch all custom folders
export async function GET() {
  try {
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

    // Get all custom folders for the user, sorted by sortOrder
    const folders = await db.query.customFolders.findMany({
      where: eq(customFolders.userId, user.id),
      orderBy: (folders, { asc }) => [
        asc(folders.sortOrder),
        asc(folders.name),
      ],
    });

    return NextResponse.json({
      success: true,
      folders,
    });
  } catch (error) {
    console.error('[Custom Folders API] Error fetching folders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

// POST - Create a new custom folder
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { name, icon, color } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 }
      );
    }

    // Check folder count limit (20)
    const existingFolders = await db.query.customFolders.findMany({
      where: eq(customFolders.userId, user.id),
    });

    if (existingFolders.length >= 20) {
      return NextResponse.json(
        { success: false, error: 'Maximum 20 folders allowed' },
        { status: 400 }
      );
    }

    // Insert new custom folder
    const result = await db
      .insert(customFolders)
      .values({
        userId: user.id,
        name: name.trim(),
        icon: icon || '📁',
        color: color || 'gray',
        sortOrder: existingFolders.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      folderId: result[0].id,
      folder: result[0],
    });
  } catch (error) {
    console.error('[Custom Folders API] Error creating folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}

// PUT - Reorder custom folders
export async function PUT(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { folderIds } = body;

    if (!Array.isArray(folderIds)) {
      return NextResponse.json(
        { success: false, error: 'folderIds must be an array' },
        { status: 400 }
      );
    }

    // Update sort order for each folder
    for (let i = 0; i < folderIds.length; i++) {
      await db
        .update(customFolders)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(eq(customFolders.id, folderIds[i]));
    }

    return NextResponse.json({
      success: true,
      message: 'Folders reordered successfully',
    });
  } catch (error) {
    console.error('[Custom Folders API] Error reordering folders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder folders' },
      { status: 500 }
    );
  }
}

