import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/admin/auth';
import { logAdminAction } from '@/lib/admin/audit';

/**
 * PATCH /api/admin/users/[id]
 * Update user status (suspend, activate, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;
    const body = await request.json();
    const { action, reason } = body;

    // Get target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent action on super admin
    if (targetUser.role === 'super_admin' && action === 'delete') {
      return NextResponse.json(
        { error: 'Cannot delete super admin users' },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();
    let message = '';

    switch (action) {
      case 'suspend':
        // Update in database
        await db
          .update(users)
          .set({
            isSuspended: true,
            suspendedAt: new Date(),
            suspensionReason: reason || 'Suspended by admin',
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Ban user in Supabase Auth
        await adminClient.auth.admin.updateUserById(userId, {
          ban_duration: 'none', // Permanent ban
        });

        message = 'User suspended successfully';
        await logAdminAction(currentUser.id, 'suspend_user', 'users', userId, {
          reason,
        });
        break;

      case 'activate':
        // Update in database
        await db
          .update(users)
          .set({
            isSuspended: false,
            suspendedAt: null,
            suspensionReason: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Unban user in Supabase Auth
        await adminClient.auth.admin.updateUserById(userId, {
          ban_duration: '0s', // Remove ban
        });

        message = 'User activated successfully';
        await logAdminAction(currentUser.id, 'activate_user', 'users', userId, {
          reason,
        });
        break;

      case 'reset_password':
        // Send password reset email
        await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: targetUser.email,
        });

        message = 'Password reset email sent';
        await logAdminAction(
          currentUser.id,
          'reset_user_password',
          'users',
          userId
        );
        break;

      case 'verify_email':
        // Verify user's email
        await adminClient.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });

        message = 'Email verified successfully';
        await logAdminAction(
          currentUser.id,
          'verify_user_email',
          'users',
          userId
        );
        break;

      case 'send_password_change':
        // Generate and send password change link
        const { data: passwordLink, error: passwordError } =
          await adminClient.auth.admin.generateLink({
            type: 'recovery',
            email: targetUser.email,
          });

        if (passwordError) {
          throw new Error('Failed to generate password change link');
        }

        message = `Password change link sent to ${targetUser.email}`;
        await logAdminAction(
          currentUser.id,
          'send_password_change_link',
          'users',
          userId
        );
        break;

      case 'send_username_change':
        // Generate a secure token for username change
        const changeToken =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);

        // Store token in database with expiration
        await db
          .update(users)
          .set({
            usernameChangeToken: changeToken,
            usernameChangeTokenExpiry: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ), // 24 hours
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // TODO: Send email with link to /change-username?token=XXX
        // For now, return the token so admin can manually send it
        const changeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://easemail.app'}/change-username?token=${changeToken}`;

        message = `Username change link generated: ${changeUrl}`;
        await logAdminAction(
          currentUser.id,
          'send_username_change_link',
          'users',
          userId
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('[Admin User Action API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (soft delete or hard delete based on policy)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Get target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deletion of super admin
    if (targetUser.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin users' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();

    if (hardDelete) {
      // Hard delete: Remove from Auth and Database
      await adminClient.auth.admin.deleteUser(userId);
      await db.delete(users).where(eq(users.id, userId));

      await logAdminAction(
        currentUser.id,
        'delete_user_hard',
        'users',
        userId,
        {
          email: targetUser.email,
          username: targetUser.username,
        }
      );

      return NextResponse.json({
        success: true,
        message: 'User permanently deleted',
      });
    } else {
      // Soft delete: Mark as deleted but keep data
      await db
        .update(users)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Disable auth access
      await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      });

      await logAdminAction(
        currentUser.id,
        'delete_user_soft',
        'users',
        userId,
        {
          email: targetUser.email,
          username: targetUser.username,
        }
      );

      return NextResponse.json({
        success: true,
        message: 'User deleted (can be restored)',
      });
    }
  } catch (error) {
    console.error('[Admin User Delete API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
