/**
 * API Route: Admin - Individual Sandbox Company
 * GET /api/admin/sandbox-companies/[id] - Get company details
 * PUT /api/admin/sandbox-companies/[id] - Update company
 * DELETE /api/admin/sandbox-companies/[id] - Delete company
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sandboxCompanies, users } from '@/db/schema';
import { requireAdmin, logAdminAction, getClientIp, getUserAgent } from '@/lib/auth/admin-auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateSandboxCompanySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'suspended', 'archived']).optional(),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioPhoneNumber: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openaiOrganizationId: z.string().optional(),
  unlimitedSms: z.boolean().optional(),
  unlimitedAi: z.boolean().optional(),
  unlimitedStorage: z.boolean().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// GET - Get Sandbox Company Details
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const company = await db.query.sandboxCompanies.findFirst({
      where: eq(sandboxCompanies.id, params.id),
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Sandbox company not found' },
        { status: 404 }
      );
    }

    // Get associated users
    const companyUsers = await db.query.users.findMany({
      where: eq(users.sandboxCompanyId, params.id),
      columns: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      company,
      users: companyUsers,
      userCount: companyUsers.length,
    });
  } catch (error) {
    console.error('❌ [Admin API] Error fetching sandbox company:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch sandbox company' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update Sandbox Company
// ============================================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    // Get existing company
    const existingCompany = await db.query.sandboxCompanies.findFirst({
      where: eq(sandboxCompanies.id, params.id),
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Sandbox company not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateSandboxCompanySchema.parse(body);

    // Update sandbox company
    const [updatedCompany] = await db
      .update(sandboxCompanies)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(sandboxCompanies.id, params.id))
      .returning();

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'update_sandbox_company',
      targetType: 'sandbox_company',
      targetId: updatedCompany.id,
      details: {
        before: {
          name: existingCompany.name,
          status: existingCompany.status,
        },
        after: {
          name: updatedCompany.name,
          status: updatedCompany.status,
        },
        metadata: {
          fieldsUpdated: Object.keys(validatedData),
        },
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    console.log(`✅ [Admin] Updated sandbox company: ${updatedCompany.name} (${updatedCompany.id})`);

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      message: `Sandbox company "${updatedCompany.name}" updated successfully`,
    });
  } catch (error) {
    console.error('❌ [Admin API] Error updating sandbox company:', error);

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
      { error: 'Failed to update sandbox company' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Sandbox Company
// ============================================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    // Get existing company
    const existingCompany = await db.query.sandboxCompanies.findFirst({
      where: eq(sandboxCompanies.id, params.id),
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Sandbox company not found' },
        { status: 404 }
      );
    }

    // Check if company has users
    const companyUsers = await db.query.users.findMany({
      where: eq(users.sandboxCompanyId, params.id),
    });

    if (companyUsers.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete company with active users',
          userCount: companyUsers.length,
          message: 'Please remove or reassign all users before deleting this company',
        },
        { status: 400 }
      );
    }

    // Delete company
    await db.delete(sandboxCompanies).where(eq(sandboxCompanies.id, params.id));

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'delete_sandbox_company',
      targetType: 'sandbox_company',
      targetId: params.id,
      details: {
        before: {
          name: existingCompany.name,
          status: existingCompany.status,
        },
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    console.log(`✅ [Admin] Deleted sandbox company: ${existingCompany.name} (${params.id})`);

    return NextResponse.json({
      success: true,
      message: `Sandbox company "${existingCompany.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('❌ [Admin API] Error deleting sandbox company:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete sandbox company' },
      { status: 500 }
    );
  }
}

