import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Convert natural language search query to structured filters
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
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Call OpenAI to parse natural language query
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a search query parser for an email client. Convert natural language queries into structured search filters.

Return JSON with this structure:
{
  "keywords": "search keywords (optional)",
  "sender": "sender email or name (optional)",
  "isUnread": true/false (optional),
  "isStarred": true/false (optional),
  "hasAttachment": true/false (optional),
  "priority": "low" | "medium" | "high" | "urgent" (optional),
  "folder": "folder name like inbox, sent, drafts" (optional),
  "startDate": "ISO date string (optional)",
  "endDate": "ISO date string (optional)",
  "noReply": true/false (optional),
  "interpretation": "Human-readable interpretation of the search"
}

Examples:
- "urgent emails from last week" → { priority: "urgent", startDate: "...", endDate: "...", interpretation: "..." }
- "emails from Sarah I haven't replied to" → { sender: "Sarah", noReply: true, interpretation: "..." }
- "unread invoices from this month" → { keywords: "invoice", isUnread: true, startDate: "...", endDate: "...", interpretation: "..." }
- "starred emails with attachments" → { isStarred: true, hasAttachment: true, interpretation: "..." }
- "emails from john@example.com yesterday" → { sender: "john@example.com", startDate: "...", endDate: "...", interpretation: "..." }

Date parsing:
- "today" → today's date range
- "yesterday" → previous day
- "this week" → Monday to Sunday
- "last week" → previous week
- "this month" → first to last day of current month
- "last 7 days" → 7 days ago to today

Only include fields that apply to the query. Always include "interpretation".`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to parse search query' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let searchFilters: any;
    try {
      searchFilters = JSON.parse(content);
    } catch (parseError) {
      // If parsing fails, use basic keyword search
      searchFilters = {
        keywords: query,
        interpretation: `Search for emails containing "${query}"`,
      };
    }

    return NextResponse.json({
      success: true,
      filters: searchFilters,
    });
  } catch (error) {
    console.error('Error in smart-search API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

