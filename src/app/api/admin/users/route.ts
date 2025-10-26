import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema for user creation
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['user', 'admin', 'super_admin']).default('user'),
  tier: z.enum(['free', 'starter', 'pro', 'enterprise']).default('free'),
  sendInvite: z.boolean().default(true),
});

/**
 * POST /api/admin/users
 * Create a new user
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

    if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, name, role, tier, sendInvite } = validation.data;

    // Create user in Supabase Auth
    const { data: newAuthUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: !sendInvite, // Auto-confirm if not sending invite
        user_metadata: {
          name,
          role,
          tier,
        },
      });

    if (authError || !newAuthUser.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user in database
    const [dbUser] = await db
      .insert(users)
      .values({
        id: newAuthUser.user.id,
        email,
        name,
        role: role as 'user' | 'admin' | 'super_admin',
        tier: tier as 'free' | 'starter' | 'pro' | 'enterprise',
      })
      .returning();

    // TODO: Send invite email if requested
    if (sendInvite) {
      // Implement email sending logic
    }

    return NextResponse.json({
      success: true,
      user: dbUser,
      inviteSent: sendInvite,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

