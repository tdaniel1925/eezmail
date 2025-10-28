import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inviteBetaUser } from '@/lib/beta/user-service';

/**
 * POST /api/beta/invite
 * Invite a new beta user (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add proper admin check

    const body = await req.json();
    const { email, firstName, lastName, company, smsLimit, aiLimit, durationDays } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await inviteBetaUser({
      email,
      firstName,
      lastName,
      company,
      invitedBy: user.id,
      smsLimit,
      aiLimit,
      durationDays,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      userId: result.userId,
      username: result.username,
      tempPassword: result.tempPassword,
    });
  } catch (error) {
    console.error('Error inviting beta user:', error);
    return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 });
  }
}

