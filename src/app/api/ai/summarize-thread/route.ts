import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { summarizeThread } from '@/lib/chat/thread-analyzer';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = await request.json();

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Generate AI summary using existing thread analyzer
    const summary = await summarizeThread({
      userId: user.id,
      threadId,
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error summarizing thread:', error);
    return NextResponse.json(
      { error: 'Failed to summarize thread' },
      { status: 500 }
    );
  }
}
