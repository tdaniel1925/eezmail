import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  previewTemplate,
  sendTestEmail,
  getTemplateAnalytics,
} from '@/lib/notifications/template-service';
import { requireAdmin } from '@/lib/admin/auth';

// Validation schema
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  slug: z.string().min(1).max(100).optional(),
  type: z.enum(['transactional', 'marketing', 'system', 'sandbox']).optional(),
  audience: z
    .enum(['all', 'sandbox', 'individual', 'team', 'enterprise', 'admin'])
    .optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  subject: z.string().min(1).optional(),
  htmlContent: z.string().min(1).optional(),
  textContent: z.string().optional(),
  preheader: z.string().optional(),
  variables: z.array(z.string()).optional(),
  images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        alt: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .optional(),
  personalizationRules: z.record(z.any()).optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  replyToEmail: z.string().email().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/admin/templates/[id] - Get template
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const template = await getTemplateById(params.id);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('❌ [Template API] Error fetching template:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch template',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/templates/[id] - Update template
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const body = await req.json();
    const validatedData = updateTemplateSchema.parse(body);

    const template = await updateTemplate(params.id, validatedData);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('❌ [Template API] Error updating template:', error);

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
          error instanceof Error ? error.message : 'Failed to update template',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/templates/[id] - Delete template
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();

    await deleteTemplate(params.id);

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('❌ [Template API] Error deleting template:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to delete template',
      },
      { status: 500 }
    );
  }
}
