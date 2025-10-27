import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  uploadTemplateImage,
  getTemplateImages,
  deleteTemplateImage,
} from '@/lib/notifications/template-service';
import { requireAdmin } from '@/lib/admin/auth';

// GET /api/admin/templates/images - List images
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const tags = searchParams.get('tags')?.split(',') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getTemplateImages({
      search,
      tags,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [Template Images API] Error fetching images:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch images',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/templates/images - Upload image
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const altText = formData.get('altText') as string | null;
    const description = formData.get('description') as string | null;
    const tags = formData.get('tags') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // TODO: Upload to cloud storage (Cloudflare R2, AWS S3, etc.)
    // For now, we'll use a placeholder URL
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const url = `/uploads/templates/${filename}`; // Placeholder - replace with actual upload

    // Get image dimensions if it's an image
    let width: number | undefined;
    let height: number | undefined;

    if (file.type.startsWith('image/')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // TODO: Use sharp or similar library to get image dimensions
        // For now, leave undefined
      } catch (error) {
        console.error('Error reading image dimensions:', error);
      }
    }

    const image = await uploadTemplateImage(
      {
        filename,
        originalFilename: file.name,
        mimeType: file.type,
        size: file.size,
        width,
        height,
        url,
      },
      {
        altText: altText || undefined,
        description: description || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
      }
    );

    return NextResponse.json(
      {
        success: true,
        image,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [Template Images API] Error uploading image:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/templates/images/[id] - Delete image
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const params = await context.params;
    await deleteTemplateImage(params.id);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('❌ [Template Images API] Error deleting image:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to delete image',
      },
      { status: 500 }
    );
  }
}
