/**
 * API Route: Admin - Sandbox Companies
 * GET /api/admin/sandbox-companies - List all sandbox companies
 * POST /api/admin/sandbox-companies - Create new sandbox company
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sandboxCompanies } from '@/db/schema';
import {
  requireAdmin,
  logAdminAction,
  getClientIp,
  getUserAgent,
} from '@/lib/auth/admin-auth';
import { desc, like, or, eq } from 'drizzle-orm';
import { z } from 'zod';
import { sendAdminCompanyCreatedNotification } from '@/lib/notifications/sandbox-notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createSandboxCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioPhoneNumber: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openaiOrganizationId: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// GET - List Sandbox Companies
// ============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = db.select().from(sandboxCompanies).$dynamic();

    // Apply filters
    if (search) {
      query = query.where(
        or(
          like(sandboxCompanies.name, `%${search}%`),
          like(sandboxCompanies.description, `%${search}%`),
          like(sandboxCompanies.contactEmail, `%${search}%`)
        )
      );
    }

    if (status && ['active', 'suspended', 'archived'].includes(status)) {
      query = query.where(eq(sandboxCompanies.status, status as any));
    }

    // Execute query
    const companies = await query
      .orderBy(desc(sandboxCompanies.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sandboxCompanies.id })
      .from(sandboxCompanies);

    return NextResponse.json({
      companies,
      pagination: {
        total: totalCount.length,
        limit,
        offset,
        hasMore: offset + limit < totalCount.length,
      },
    });
  } catch (error) {
    console.error('❌ [Admin API] Error listing sandbox companies:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to list sandbox companies' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Sandbox Company
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createSandboxCompanySchema.parse(body);

    // Create sandbox company
    const [newCompany] = await db
      .insert(sandboxCompanies)
      .values({
        name: validatedData.name,
        description: validatedData.description,
        twilioAccountSid: validatedData.twilioAccountSid,
        twilioAuthToken: validatedData.twilioAuthToken,
        twilioPhoneNumber: validatedData.twilioPhoneNumber,
        openaiApiKey: validatedData.openaiApiKey,
        openaiOrganizationId: validatedData.openaiOrganizationId,
        contactEmail: validatedData.contactEmail,
        contactName: validatedData.contactName,
        contactPhone: validatedData.contactPhone,
        notes: validatedData.notes,
        tags: validatedData.tags,
        createdBy: admin.id,
      })
      .returning();

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'create_sandbox_company',
      targetType: 'sandbox_company',
      targetId: newCompany.id,
      details: {
        after: {
          name: newCompany.name,
          status: newCompany.status,
        },
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    console.log(
      `✅ [Admin] Created sandbox company: ${newCompany.name} (${newCompany.id})`
    );

    // Send notification email to admin (non-blocking)
    sendAdminCompanyCreatedNotification(newCompany.id, admin.id).catch(
      (error) => {
        console.error(
          '❌ [Admin API] Error sending company created notification:',
          error
        );
        // Don't fail the request if notification fails
      }
    );

    return NextResponse.json(
      {
        success: true,
        company: newCompany,
        message: `Sandbox company "${newCompany.name}" created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [Admin API] Error creating sandbox company:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to create sandbox company' },
      { status: 500 }
    );
  }
}
