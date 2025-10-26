import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';

const bulkOperationSchema = z.object({
  action: z.enum(['suspend', 'activate', 'changeTier', 'changeRole', 'delete']),
  userIds: z.array(z.string()).min(1),
  value: z.string().optional(), // For changeTier and changeRole
});

/**
 * POST /api/admin/users/bulk
 * Perform bulk operations on users
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';
    const isSuperAdmin = userData?.role === 'super_admin';

    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = bulkOperationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { action, userIds, value } = validation.data;

    // Only super admins can delete
    if (action === 'delete' && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only super admins can delete users' },
        { status: 403 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; error: string }>,
    };

    for (const userId of userIds) {
      try {
        switch (action) {
          case 'suspend':
            await db
              .update(users)
              .set({ status: 'suspended' } as any)
              .where(inArray(users.id, [userId]));
            results.success++;
            break;

          case 'activate':
            await db
              .update(users)
              .set({ status: 'active' } as any)
              .where(inArray(users.id, [userId]));
            results.success++;
            break;

          case 'changeTier':
            if (!value) {
              results.failed++;
              results.errors.push({ userId, error: 'Tier value required' });
              continue;
            }
            await db
              .update(users)
              .set({ tier: value as any })
              .where(inArray(users.id, [userId]));
            results.success++;
            break;

          case 'changeRole':
            if (!value) {
              results.failed++;
              results.errors.push({ userId, error: 'Role value required' });
              continue;
            }
            await db
              .update(users)
              .set({ role: value as any })
              .where(inArray(users.id, [userId]));
            // Update auth metadata
            await supabase.auth.admin.updateUserById(userId, {
              user_metadata: { role: value },
            });
            results.success++;
            break;

          case 'delete':
            await supabase.auth.admin.deleteUser(userId);
            await db.delete(users).where(inArray(users.id, [userId]));
            results.success++;
            break;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({ userId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

