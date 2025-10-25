import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, inArray, sql, desc, gte, lte, or, like } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Convert natural language search query to structured filters and search emails
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

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        filters: {},
        results: [],
        interpretation: 'No email accounts found',
      });
    }

    const accountIds = userAccounts.map((acc) => acc.id);

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
  "isUnread": true/false (optional)",
  "isStarred": true/false (optional)",
  "hasAttachment": true/false (optional)",
  "priority": "low" | "medium" | "high" | "urgent" (optional)",
  "folder": "folder name like inbox, sent, drafts" (optional)",
  "startDate": "ISO date string (optional)",
  "endDate": "ISO date string (optional)",
  "noReply": true/false (optional)",
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

    // Build database query conditions
    const conditions: any[] = [
      inArray(emails.accountId, accountIds),
      eq(emails.isTrashed, false),
    ];

    // Keywords search (subject, body, snippet)
    if (searchFilters.keywords) {
      const keywordCondition = or(
        like(emails.subject, `%${searchFilters.keywords}%`),
        like(sql`CAST(${emails.body} AS TEXT)`, `%${searchFilters.keywords}%`),
        like(emails.snippet, `%${searchFilters.keywords}%`)
      );
      if (keywordCondition) conditions.push(keywordCondition);
    }

    // Sender filter
    if (searchFilters.sender) {
      conditions.push(
        or(
          sql`LOWER(${emails.fromAddress}->>'email') LIKE LOWER(${'%' + searchFilters.sender + '%'})`,
          sql`LOWER(${emails.fromAddress}->>'name') LIKE LOWER(${'%' + searchFilters.sender + '%'})`
        )
      );
    }

    // Boolean filters
    if (searchFilters.isUnread !== undefined) {
      conditions.push(eq(emails.isRead, !searchFilters.isUnread));
    }

    if (searchFilters.isStarred !== undefined) {
      conditions.push(eq(emails.isStarred, searchFilters.isStarred));
    }

    if (searchFilters.hasAttachment !== undefined) {
      conditions.push(eq(emails.hasAttachments, searchFilters.hasAttachment));
    }

    // Folder filter
    if (searchFilters.folder) {
      conditions.push(
        like(emails.folderName, `%${searchFilters.folder.toUpperCase()}%`)
      );
    }

    // Date range filters
    if (searchFilters.startDate) {
      conditions.push(
        gte(emails.receivedAt, new Date(searchFilters.startDate))
      );
    }

    if (searchFilters.endDate) {
      conditions.push(lte(emails.receivedAt, new Date(searchFilters.endDate)));
    }

    // Execute search query
    const searchResults = await db
      .select()
      .from(emails)
      .where(and(...conditions))
      .orderBy(desc(emails.receivedAt))
      .limit(50);

    console.log(
      `[Smart Search] Query: "${query}" → Found ${searchResults.length} results`
    );
    console.log('[Smart Search] Filters:', searchFilters);

    return NextResponse.json({
      success: true,
      filters: searchFilters,
      results: searchResults,
      interpretation: searchFilters.interpretation,
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
