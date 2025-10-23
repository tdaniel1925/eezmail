'use server';

import { db } from '@/lib/db';
import { calendarEvents, calendarAttendees } from '@/db/schema';
import { eq, and, gte, lte, or, ilike, desc } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Semantic search over calendar events
 */
export async function searchCalendarSemanticRAG(
  query: string,
  userId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<{
  events: any[];
  summary: string;
  totalFound: number;
}> {
  try {
    const limit = options?.limit || 10;
    const searchTerms = query.toLowerCase().split(' ');

    // Build where clause
    const whereConditions = [eq(calendarEvents.userId, userId)];

    // Add date range if provided
    if (options?.startDate) {
      whereConditions.push(gte(calendarEvents.startTime, options.startDate));
    }
    if (options?.endDate) {
      whereConditions.push(lte(calendarEvents.endTime, options.endDate));
    }

    // Add text search conditions
    const textConditions = searchTerms.map(term =>
      or(
        ilike(calendarEvents.title, `%${term}%`),
        ilike(calendarEvents.description, `%${term}%`),
        ilike(calendarEvents.location, `%${term}%`)
      )
    );

    whereConditions.push(or(...textConditions));

    // Query events
    const events = await db.query.calendarEvents.findMany({
      where: and(...whereConditions),
      with: {
        attendees: true,
        reminders: true,
      },
      orderBy: [desc(calendarEvents.startTime)],
      limit: limit * 2, // Get more for ranking
    });

    if (events.length === 0) {
      return { events: [], summary: '', totalFound: 0 };
    }

    // Score and rank events
    const scoredEvents = events.map(event => {
      const searchText = [
        event.title,
        event.description,
        event.location,
        event.attendees?.map((a: any) => a.email).join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      let score = 0;
      searchTerms.forEach(term => {
        if (searchText.includes(term)) {
          score += 1;
        }
      });

      // Boost for exact title match
      if (event.title?.toLowerCase().includes(query.toLowerCase())) {
        score += 3;
      }

      // Boost for upcoming events
      const now = new Date();
      if (event.startTime > now) {
        score += 1;
      }

      return { ...event, relevanceScore: score };
    });

    const topEvents = scoredEvents
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    const summary = generateCalendarSummary(topEvents, query);

    return {
      events: topEvents,
      summary,
      totalFound: topEvents.length,
    };
  } catch (error) {
    console.error('Error in calendar semantic search:', error);
    return { events: [], summary: '', totalFound: 0 };
  }
}

/**
 * Get upcoming events for context
 */
export async function getUpcomingEventsContext(
  userId: string,
  days: number = 7
): Promise<string> {
  try {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const upcomingEvents = await db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.userId, userId),
        gte(calendarEvents.startTime, now),
        lte(calendarEvents.startTime, future)
      ),
      orderBy: [calendarEvents.startTime],
      limit: 10,
    });

    if (upcomingEvents.length === 0) {
      return `No upcoming events in the next ${days} days.`;
    }

    const summary = upcomingEvents
      .map((event: any) => {
        const date = new Date(event.startTime).toLocaleString();
        const location = event.location ? ` at ${event.location}` : '';
        return `${event.title} on ${date}${location}`;
      })
      .join('\n');

    return `Upcoming events:\n${summary}`;
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return '';
  }
}

/**
 * Search for events by attendee
 */
export async function searchEventsByAttendee(
  userId: string,
  attendeeEmail: string
): Promise<any[]> {
  try {
    // Find all events with this attendee
    const attendeeRecords = await db.query.calendarAttendees.findMany({
      where: ilike(calendarAttendees.email, `%${attendeeEmail}%`),
      with: {
        event: true,
      },
    });

    // Filter by user and return events
    const userEvents = attendeeRecords
      .filter((record: any) => record.event?.userId === userId)
      .map((record: any) => record.event);

    return userEvents;
  } catch (error) {
    console.error('Error searching events by attendee:', error);
    return [];
  }
}

/**
 * Generate human-readable summary from calendar search results
 */
function generateCalendarSummary(events: any[], query: string): string {
  if (events.length === 0) {
    return `No calendar events found matching "${query}".`;
  }

  const summaries = events.map((event: any) => {
    const date = new Date(event.startTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const location = event.location ? ` at ${event.location}` : '';
    return `${event.title} - ${date}${location}`;
  });

  if (events.length === 1) {
    return `Found event: ${summaries[0]}`;
  }

  return `Found ${events.length} events:\n${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
}

/**
 * Parse natural language date/time expressions
 */
export function parseNaturalDateTime(input: string): {
  startDate?: Date;
  endDate?: Date;
} {
  const now = new Date();
  const lower = input.toLowerCase();

  // Today
  if (lower.includes('today')) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  // Tomorrow
  if (lower.includes('tomorrow')) {
    const start = new Date(now);
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  // This week
  if (lower.includes('this week')) {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  // Next week
  if (lower.includes('next week')) {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  // This month
  if (lower.includes('this month')) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  return {};
}

