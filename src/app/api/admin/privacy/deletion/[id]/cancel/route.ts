import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { dataDeletionRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // Update the deletion request to cancelled status
    const [updatedRequest] = await db
      .update(dataDeletionRequests)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dataDeletionRequests.id, id))
      .returning();

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Deletion request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deletion request cancelled successfully',
      request: updatedRequest,
    });
  } catch (error) {
    console.error(
      `[Admin Privacy Deletion Cancel API ${params.id}] Error:`,
      error
    );
    return NextResponse.json(
      { error: 'Failed to cancel deletion request' },
      { status: 500 }
    );
  }
}
