/**
 * API Route: Admin - Sandbox Users
 * POST /api/admin/sandbox-companies/[id]/users - Create sandbox user
 * GET /api/admin/sandbox-companies/[id]/users - List company users
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, sandboxCompanies } from '@/db/schema';
import { requireAdmin, logAdminAction, getClientIp, getUserAgent } from '@/lib/auth/admin-auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createSandboxUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  fullName: z.string().min(1, 'Full name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ============================================================================
// POST - Create Sandbox User
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const companyId = params.id;

    // Verify sandbox company exists
    const company = await db.query.sandboxCompanies.findFirst({
      where: eq(sandboxCompanies.id, companyId),
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Sandbox company not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createSandboxUserSchema.parse(body);

    // Create user in Supabase Auth
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm sandbox users
      user_metadata: {
        full_name: validatedData.fullName,
        role: 'sandbox_user',
        sandbox_company_id: companyId,
      },
    });

    if (authError || !authData.user) {
      console.error('❌ [Admin] Error creating Supabase user:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create user in database
    const [newUser] = await db
      .insert(users)
      .values({
        id: authData.user.id,
        email: validatedData.email,
        fullName: validatedData.fullName,
        role: 'sandbox_user',
        sandboxCompanyId: companyId,
        subscriptionTier: 'enterprise', // Give sandbox users enterprise tier
      })
      .returning();

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'create_sandbox_user',
      targetType: 'user',
      targetId: newUser.id,
      details: {
        after: {
          email: newUser.email,
          role: newUser.role,
          sandboxCompanyId: companyId,
        },
        metadata: {
          companyName: company.name,
        },
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    console.log(`✅ [Admin] Created sandbox user: ${newUser.email} for company: ${company.name}`);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          sandboxCompanyId: newUser.sandboxCompanyId,
        },
        message: `Sandbox user "${newUser.email}" created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [Admin API] Error creating sandbox user:', error);

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
      { error: 'Failed to create sandbox user' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - List Sandbox Company Users
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const companyId = params.id;

    // Get company users
    const companyUsers = await db.query.users.findMany({
      where: eq(users.sandboxCompanyId, companyId),
      columns: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        subscriptionTier: true,
        smsSentCount: true,
        aiTokensUsed: true,
        createdAt: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return NextResponse.json({
      users: companyUsers,
      count: companyUsers.length,
    });
  } catch (error) {
    console.error('❌ [Admin API] Error listing sandbox users:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to list sandbox users' },
      { status: 500 }
    );
  }
}

