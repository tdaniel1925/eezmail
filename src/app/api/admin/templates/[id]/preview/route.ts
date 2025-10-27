import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { previewTemplate } from '@/lib/notifications/template-service';
import { requireAdmin } from '@/lib/admin/auth';

const previewSchema = z.object({
  variables: z.record(z.string()),
});

// POST /api/admin/templates/[id]/preview - Preview template
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const body = await req.json();
    const { variables } = previewSchema.parse(body);

    const preview = await previewTemplate(params.id, variables);

    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error('❌ [Template API] Error previewing template:', error);

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
          error instanceof Error ? error.message : 'Failed to preview template',
      },
      { status: 500 }
    );
  }
}
