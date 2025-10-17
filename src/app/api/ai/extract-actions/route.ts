import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { db } from '@/lib/db';
import { extractedActions } from '@/db/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract action items from an email
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
    const { emailId, subject, bodyText } = body;

    if (!subject || !bodyText) {
      return NextResponse.json(
        { error: 'Email subject and body are required' },
        { status: 400 }
      );
    }

    // Call OpenAI to extract action items
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an action item extraction assistant. Analyze emails and extract all tasks, deadlines, requests, and action items.

Return a JSON array of action items with this structure:
[
  {
    "description": "Clear, actionable task description",
    "dueDate": "ISO date string or null",
    "priority": "low" | "medium" | "high" | "urgent",
    "assignee": "person name or null"
  }
]

Look for:
- Explicit tasks ("Please review", "Can you send", "Need to complete")
- Questions requiring response
- Deadlines and due dates (today, tomorrow, by Friday, etc.)
- Meeting requests or scheduling needs
- Approvals or decisions needed

Priority levels:
- urgent: Explicit urgency, same-day deadlines
- high: Near-term deadlines (within 2-3 days), important requests
- medium: Standard tasks, normal deadlines
- low: Optional items, distant deadlines

Return empty array [] if no action items found.`,
        },
        {
          role: 'user',
          content: `Subject: ${subject}\n\nBody:\n${bodyText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to extract actions' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let actions: any[];
    try {
      actions = JSON.parse(content);

      if (!Array.isArray(actions)) {
        throw new Error('Invalid format');
      }
    } catch (parseError) {
      // If parsing fails, return empty array
      actions = [];
    }

    // Save to database if emailId provided
    if (emailId && actions.length > 0) {
      for (const action of actions) {
        await db.insert(extractedActions).values({
          emailId,
          userId: user.id,
          description: action.description,
          dueDate: action.dueDate ? new Date(action.dueDate) : null,
          priority: action.priority || 'medium',
          assignee: action.assignee || null,
          isCompleted: false,
        } as any);
      }
    }

    return NextResponse.json({
      success: true,
      actions,
      count: actions.length,
    });
  } catch (error) {
    console.error('Error in extract-actions API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

