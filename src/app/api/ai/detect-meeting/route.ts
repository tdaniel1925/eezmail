import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Detect meeting details from email content
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { subject, bodyText, senderName } = body;

    if (!subject || !bodyText) {
      return NextResponse.json(
        { error: 'Email subject and body are required' },
        { status: 400 }
      );
    }

    // Call OpenAI to detect meeting
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a meeting detection assistant. Analyze emails and extract meeting/event details.

Return JSON with this structure if a meeting is detected:
{
  "hasMeeting": true,
  "title": "Meeting subject/title",
  "date": "ISO date string (YYYY-MM-DD)",
  "time": "Time string (e.g., '2:00 PM' or '14:00')",
  "duration": "Duration in minutes (estimate if not specified)",
  "location": "Physical location or 'Virtual' or null",
  "attendees": ["Attendee names"],
  "agenda": "Brief description of meeting purpose",
  "confidence": "high" | "medium" | "low"
}

If no meeting detected, return:
{
  "hasMeeting": false
}

Look for:
- Meeting invites (calendar invitations)
- Scheduling requests ("Let's meet", "Can we schedule")
- Confirmed meetings ("Our meeting is", "See you at")
- Date/time indicators (Monday, tomorrow, next week, 2pm, 14:00)
- Location mentions (conference room, Zoom, Teams, address)

Date parsing:
- "tomorrow" → next day
- "next Monday" → calculate next Monday
- "Friday" → this coming Friday
- "Oct 15" or "10/15" → parse to date`,
        },
        {
          role: 'user',
          content: `From: ${senderName || 'Unknown'}\nSubject: ${subject}\n\nBody:\n${bodyText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to detect meeting' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let meetingData: any;
    try {
      meetingData = JSON.parse(content);
    } catch (parseError) {
      // If parsing fails, assume no meeting
      meetingData = { hasMeeting: false };
    }

    return NextResponse.json({
      success: true,
      ...meetingData,
    });
  } catch (error) {
    console.error('Error in detect-meeting API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



