import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { isAdmin } from '@/lib/admin/auth';

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

    // Check if user is admin using the centralized admin check
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      console.log('[Admin API] User is not admin:', user.email);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
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

    // Use admin client for creating users
    const adminClient = createAdminClient();

    // Check if user already exists in Auth
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    if (existingUser) {
      console.log('[Admin API] User already exists:', email);
      return NextResponse.json(
        { error: `User with email ${email} already exists` },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: newAuthUser, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        email_confirm: !sendInvite, // Auto-confirm if not sending invite
        user_metadata: {
          name,
          role,
          tier,
        },
      });

    if (authError || !newAuthUser.user) {
      console.error('[Admin API] Auth error:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user in authentication system' },
        { status: 500 }
      );
    }

    // Create user in database with upsert to handle race conditions
    const [dbUser] = await db
      .insert(users)
      .values({
        id: newAuthUser.user.id,
        email,
        name,
        role: role as 'user' | 'admin' | 'super_admin',
        tier: tier as 'free' | 'starter' | 'pro' | 'enterprise',
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email,
          name,
          role: role as 'user' | 'admin' | 'super_admin',
          tier: tier as 'free' | 'starter' | 'pro' | 'enterprise',
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log('[Admin API] User created successfully:', dbUser.email);

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
    console.error('[Admin API] Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
