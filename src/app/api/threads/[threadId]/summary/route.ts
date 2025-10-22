import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { summarizeThread } from '@/lib/chat/thread-analyzer';

// GET /api/threads/[threadId]/summary - Get thread timeline with AI summary
export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = params;

    // Fetch all emails in thread
    const { data: emails, error } = await supabase
      .from('emails')
      .select('*')
      .eq('thread_id', threadId)
      .order('received_at', { ascending: true });

    if (error) {
      console.error('Error fetching thread emails:', error);
      return NextResponse.json(
        { error: 'Failed to fetch thread' },
        { status: 500 }
      );
    }

    if (!emails || emails.length === 0) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Format messages for frontend
    const messages = emails.map((email) => ({
      id: email.id,
      subject: email.subject,
      from: email.from_address || { email: 'unknown@example.com' },
      to: email.to_address ? [email.to_address] : [],
      cc: email.cc_address ? [email.cc_address] : [],
      bodyText: email.body_text || '',
      bodyHtml: email.body_html || undefined,
      receivedAt: email.received_at,
      isRead: email.is_read,
    }));

    // Generate AI summary of thread
    let summary = null;
    try {
      summary = await summarizeThread({
        userId: user.id,
        threadId,
      });
    } catch (error) {
      console.error('Error generating thread summary:', error);
      // Continue without summary - it's not critical
    }

    return NextResponse.json({
      messages,
      summary,
      threadId,
      count: messages.length,
    });
  } catch (error) {
    console.error('Error in thread summary API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


