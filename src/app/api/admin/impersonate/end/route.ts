/**
 * End Impersonation API Route
 * DELETE /api/admin/impersonate/end
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { endImpersonation } from '@/lib/admin/impersonation';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session token from request
    const sessionToken = request.headers.get('x-impersonation-token');

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token not provided' },
        { status: 400 }
      );
    }

    // End impersonation session
    await endImpersonation(sessionToken);

    return NextResponse.json({
      success: true,
      message: 'Impersonation session ended',
    });
  } catch (error) {
    console.error('[Impersonation End] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to end impersonation' },
      { status: 500 }
    );
  }
}
