import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and, or, like, desc, asc, gte, lte, count } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for email search request
const searchEmailSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  folderId: z.string().optional(),
  accountId: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  sortBy: z
    .enum(['date', 'subject', 'from', 'relevance'])
    .optional()
    .default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  unreadOnly: z.boolean().optional().default(false),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = searchEmailSchema.parse(body);

    // Build search conditions
    const conditions = [
      eq(emails.userId, user.id),
      or(
        like(emails.subject, `%${validatedData.query}%`),
        like(emails.from, `%${validatedData.query}%`),
        like(emails.body, `%${validatedData.query}%`)
      ),
    ];

    // Add folder filter if specified
    if (validatedData.folderId) {
      conditions.push(eq(emails.folderId, validatedData.folderId));
    }

    // Add account filter if specified
    if (validatedData.accountId) {
      conditions.push(eq(emails.accountId, validatedData.accountId));
    }

    // Add unread filter if specified
    if (validatedData.unreadOnly) {
      conditions.push(eq(emails.isRead, false));
    }

    // Add date filters if specified
    if (validatedData.dateFrom) {
      conditions.push(gte(emails.receivedAt, new Date(validatedData.dateFrom)));
    }
    if (validatedData.dateTo) {
      conditions.push(lte(emails.receivedAt, new Date(validatedData.dateTo)));
    }

    // Build sort order
    let orderBy;
    switch (validatedData.sortBy) {
      case 'subject':
        orderBy =
          validatedData.sortOrder === 'asc'
            ? asc(emails.subject)
            : desc(emails.subject);
        break;
      case 'from':
        orderBy =
          validatedData.sortOrder === 'asc'
            ? asc(emails.from)
            : desc(emails.from);
        break;
      case 'relevance':
        // For now, use date as relevance proxy
        orderBy = desc(emails.receivedAt);
        break;
      default:
        orderBy =
          validatedData.sortOrder === 'asc'
            ? asc(emails.receivedAt)
            : desc(emails.receivedAt);
    }

    // Execute search query
    const searchResults = await db.query.emails.findMany({
      where: and(...conditions),
      orderBy: orderBy,
      limit: validatedData.limit,
      offset: validatedData.offset,
    });

    // Get total count for pagination
    const totalCount = await db
      .select({ count: count() })
      .from(emails)
      .where(and(...conditions));

    console.log('Email search:', {
      query: validatedData.query,
      results: searchResults.length,
      total: totalCount[0]?.count || 0,
    });

    return NextResponse.json({
      success: true,
      results: searchResults,
      total: totalCount[0]?.count || 0,
      hasMore:
        validatedData.offset + validatedData.limit <
        (totalCount[0]?.count || 0),
      query: validatedData.query,
    });
  } catch (error) {
    console.error('Error searching emails:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search emails' },
      { status: 500 }
    );
  }
}
