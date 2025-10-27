/**
 * API Route: Admin - Individual Sandbox Company
 * GET /api/admin/sandbox-companies/[id] - Get company details
 * PUT /api/admin/sandbox-companies/[id] - Update company
 * DELETE /api/admin/sandbox-companies/[id] - Delete company
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
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'suspended', 'archived']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const [company] = await db
      .select()
      .from(sandboxCompanies)
      .where(eq(sandboxCompanies.id, params.id))
      .limit(1);

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('[Admin API] Error fetching company:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const validatedData = updateCompanySchema.parse(body);

    // Get current company data for audit log
    const [currentCompany] = await db
      .select()
      .from(sandboxCompanies)
      .where(eq(sandboxCompanies.id, params.id))
      .limit(1);

    if (!currentCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Update company
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
      targetId: params.id,
      details: {
        before: currentCompany,
        after: updatedCompany,
        changes: validatedData,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return NextResponse.json({
      success: true,
      company: updatedCompany,
    });
  } catch (error) {
    console.error('[Admin API] Error updating company:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    // Check if company exists and has users
    const [company] = await db
      .select()
      .from(sandboxCompanies)
      .where(eq(sandboxCompanies.id, params.id))
      .limit(1);

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
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
        before: company,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    console.error('[Admin API] Error deleting company:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}
