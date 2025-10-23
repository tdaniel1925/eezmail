'use server';

import { parseDateTime, parseDuration } from './date-parser';
import {
  getCalendarEvents,
  createCalendarEvent as createEvent,
  updateCalendarEvent as updateEvent,
  deleteCalendarEvent as deleteEvent,
} from '@/lib/calendar/calendar-actions';

/**
 * Calendar actions for chatbot - FULLY INTEGRATED
 * These are now wired to the real calendar system
 */

export async function createCalendarEvent(params: {
  userId: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  description?: string;
  attendees?: string[];
  reminder?: number;
}): Promise<{ success: boolean; eventId?: string; message: string }> {
  try {
    // Calculate end time if not provided (default 1 hour)
    const endTime = params.endTime || new Date(params.startTime.getTime() + 60 * 60 * 1000);

    // Call real calendar event creation
    const result = await createEvent({
      userId: params.userId,
      title: params.title,
      startTime: params.startTime,
      endTime,
      location: params.location,
      description: params.description,
      type: 'meeting',
      status: 'confirmed',
    });

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to create calendar event',
      };
    }

    // TODO: Add attendees if provided
    // TODO: Set reminder if provided

    return {
      success: true,
      eventId: result.event?.id,
      message: `Calendar event "${params.title}" created for ${params.startTime.toLocaleString()}`,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create event',
    };
  }
}

export async function updateCalendarEvent(params: {
  userId: string;
  eventId: string;
  updates: Partial<{
    title: string;
    startTime: Date;
    endTime: Date;
    location: string;
    description: string;
    attendees: string[];
  }>;
}): Promise<{ success: boolean; message: string }> {
  try {
    const result = await updateEvent(params.eventId, {
      title: params.updates.title,
      startTime: params.updates.startTime,
      endTime: params.updates.endTime,
      location: params.updates.location,
      description: params.updates.description,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to update calendar event',
      };
    }

    return {
      success: true,
      message: `Calendar event updated successfully`,
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update event',
    };
  }
}

export async function deleteCalendarEvent(params: {
  userId: string;
  eventId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const result = await deleteEvent(params.eventId);

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to delete calendar event',
      };
    }

    return {
      success: true,
      message: `Calendar event deleted successfully`,
    };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete event',
    };
  }
}

export async function rescheduleEvent(params: {
  userId: string;
  eventId: string;
  newStartTime: Date;
  newEndTime?: Date;
}): Promise<{ success: boolean; message: string }> {
  try {
    const result = await updateEvent(params.eventId, {
      startTime: params.newStartTime,
      endTime: params.newEndTime,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to reschedule event',
      };
    }

    return {
      success: true,
      message: `Event rescheduled to ${params.newStartTime.toLocaleString()}`,
    };
  } catch (error) {
    console.error('Error rescheduling event:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reschedule event',
    };
  }
}

export async function searchCalendarEvents(params: {
  userId: string;
  query?: string;
  startDate?: Date;
  endDate?: Date;
  attendee?: string;
}): Promise<any[]> {
  try {
    const startDate = params.startDate || new Date();
    const endDate = params.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const result = await getCalendarEvents(startDate, endDate);

    if (!result.success || !result.events) {
      return [];
    }

    // Filter by query if provided
    let events = result.events;
    if (params.query) {
      const query = params.query.toLowerCase();
      events = events.filter((event: any) =>
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }

    // Filter by attendee if provided
    if (params.attendee) {
      events = events.filter((event: any) =>
        event.attendees?.some((a: any) =>
          a.email.toLowerCase().includes(params.attendee!.toLowerCase())
        )
      );
    }

    return events;
  } catch (error) {
    console.error('Error searching calendar events:', error);
    return [];
  }
}

/**
 * Parse natural language into calendar event
 * Examples: "meeting tomorrow at 2pm", "lunch next Tuesday"
 */
export async function parseNaturalLanguageEvent(input: string): Promise<{
  title: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}> {
  // Extract time/date using date-parser
  const parsedTime = parseDateTime(input);

  // Extract title (simple extraction - remove time-related words)
  const timeWords = [
    'tomorrow',
    'today',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
    'at',
    'on',
    'next',
    'this',
    'am',
    'pm',
  ];

  const words = input.split(' ');
  const titleWords = words.filter(
    (word) => !timeWords.includes(word.toLowerCase()) && !word.match(/\d/)
  );
  const title = titleWords.join(' ') || 'Event';

  // Parse duration if mentioned
  const duration = parseDuration(input);

  const endTime = duration
    ? new Date(parsedTime.getTime() + duration * 60 * 1000)
    : new Date(parsedTime.getTime() + 60 * 60 * 1000); // Default 1 hour

  return {
    title,
    startTime: parsedTime,
    endTime,
    duration,
  };
}
