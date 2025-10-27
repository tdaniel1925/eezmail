import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { duplicateTemplate } from '@/lib/notifications/template-service';
import { requireAdmin } from '@/lib/admin/auth';

const duplicateSchema = z.object({
  newName: z.string().min(1).max(200),
});

// POST /api/admin/templates/[id]/duplicate - Duplicate template
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const body = await req.json();
    const { newName } = duplicateSchema.parse(body);

    const template = await duplicateTemplate(params.id, newName);

    return NextResponse.json(
      {
        success: true,
        template,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [Template API] Error duplicating template:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to duplicate template',
      },
      { status: 500 }
    );
  }
}
