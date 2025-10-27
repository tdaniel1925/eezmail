/**
 * API Route: Admin - Remove User from Sandbox Company
 * DELETE /api/admin/sandbox-companies/[id]/users/[userId] - Remove user from company
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, sandboxCompanies } from '@/db/schema';
import {
  requireAdmin,
  logAdminAction,
  getClientIp,
  getUserAgent,
} from '@/lib/auth/admin-auth';
import { eq } from 'drizzle-orm';
import { sendUserRemovedNotification } from '@/lib/notifications/sandbox-notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    // Check if user exists and is assigned to this company
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.sandboxCompanyId !== params.id) {
      return NextResponse.json(
        { error: 'User is not assigned to this company' },
        { status: 400 }
      );
    }

    // Get company name for notification
    const [company] = await db
      .select()
      .from(sandboxCompanies)
      .where(eq(sandboxCompanies.id, params.id))
      .limit(1);

    // Remove user from company
    const [updatedUser] = await db
      .update(users)
      .set({
        sandboxCompanyId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.userId))
      .returning();

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'remove_user_from_sandbox',
      targetType: 'user',
      targetId: params.userId,
      details: {
        sandboxCompanyId: params.id,
        userEmail: updatedUser.email,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    // Send notification email to user (non-blocking)
    if (company) {
      sendUserRemovedNotification(params.userId, company.name).catch(
        (error) => {
          console.error(
            '❌ [Admin API] Error sending removal notification:',
            error
          );
          // Don't fail the request if notification fails
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User removed successfully',
    });
  } catch (error) {
    console.error('[Admin API] Error removing user:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to remove user' },
      { status: 500 }
    );
  }
}
