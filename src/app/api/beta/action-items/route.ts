import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActionItems, updateActionItemStatus } from '@/lib/beta/action-items-generator';

/**
 * GET /api/beta/action-items
 * Get all action items (admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actionItems = await getActionItems();

    return NextResponse.json({ actionItems });
  } catch (error) {
    console.error('Error fetching action items:', error);
    return NextResponse.json({ error: 'Failed to fetch action items' }, { status: 500 });
  }
}

/**
 * PATCH /api/beta/action-items
 * Update action item status (admin only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await updateActionItemStatus(id, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating action item:', error);
    return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 });
  }
}

