/**
 * API Route: Admin - Sandbox Company Users
 * GET /api/admin/sandbox-companies/[id]/users - List users in company
 * POST /api/admin/sandbox-companies/[id]/users - Assign user to company
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import {
  requireAdmin,
  logAdminAction,
  getClientIp,
  getUserAgent,
} from '@/lib/auth/admin-auth';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import {
  sendUserWelcomeNotification,
  sendAdminUserAssignedNotification,
} from '@/lib/notifications/sandbox-notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const assignUserSchema = z.object({
  userId: z.string().uuid(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const companyUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.sandboxCompanyId, params.id));

    return NextResponse.json({ users: companyUsers });
  } catch (error) {
    console.error('[Admin API] Error fetching company users:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch company users' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { userId } = assignUserSchema.parse(body);

    // Check if user exists and is not already assigned
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.sandboxCompanyId) {
      return NextResponse.json(
        { error: 'User is already assigned to a sandbox company' },
        { status: 400 }
      );
    }

    // Assign user to company
    const [updatedUser] = await db
      .update(users)
      .set({
        sandboxCompanyId: params.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'assign_user_to_sandbox',
      targetType: 'user',
      targetId: userId,
      details: {
        sandboxCompanyId: params.id,
        userEmail: updatedUser.email,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    // Send notification emails (non-blocking)
    Promise.all([
      sendUserWelcomeNotification(userId, params.id),
      sendAdminUserAssignedNotification(userId, params.id, admin.id),
    ]).catch((error) => {
      console.error('❌ [Admin API] Error sending notifications:', error);
      // Don't fail the request if notifications fail
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Admin API] Error assigning user:', error);

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
      { error: 'Failed to assign user' },
      { status: 500 }
    );
  }
}
