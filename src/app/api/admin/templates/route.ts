import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getTemplates,
  createTemplate,
} from '@/lib/notifications/template-service';
import { requireAdmin } from '@/lib/admin/auth';

// Validation schema
const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  slug: z.string().min(1).max(100),
  type: z.enum(['transactional', 'marketing', 'system', 'sandbox']),
  audience: z
    .enum(['all', 'sandbox', 'individual', 'team', 'enterprise', 'admin'])
    .default('all'),
  status: z.enum(['draft', 'active', 'paused', 'archived']).default('draft'),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  preheader: z.string().optional(),
  variables: z.array(z.string()).default([]),
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
    .default([]),
  personalizationRules: z.record(z.any()).default({}),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  replyToEmail: z.string().email().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// GET /api/admin/templates - List templates
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const audience = searchParams.get('audience') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getTemplates({
      type,
      audience,
      status,
      search,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [Template API] Error fetching templates:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch templates',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/templates - Create template
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();

    const body = await req.json();
    const validatedData = createTemplateSchema.parse(body);

    const template = await createTemplate(validatedData);

    return NextResponse.json(
      {
        success: true,
        template,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [Template API] Error creating template:', error);

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
          error instanceof Error ? error.message : 'Failed to create template',
      },
      { status: 500 }
    );
  }
}
