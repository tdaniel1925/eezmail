'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import {
  calendarEvents,
  calendarAttendees,
  calendarReminders,
  type CalendarEvent,
  type NewCalendarEvent,
  type NewCalendarAttendee,
  type NewCalendarReminder,
} from '@/db/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Get all calendar events for a user within a date range
 */
export async function getCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; events?: CalendarEvent[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const events = await db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.userId, user.id),
        gte(calendarEvents.startTime, startDate),
        lte(calendarEvents.endTime, endDate)
      ),
      orderBy: [asc(calendarEvents.startTime)],
      with: {
        attendees: true,
        reminders: true,
      },
    });

    return { success: true, events };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch events',
    };
  }
}

/**
 * Get a single calendar event by ID
 */
export async function getCalendarEvent(
  eventId: string
): Promise<{ success: boolean; event?: CalendarEvent; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const event = await db.query.calendarEvents.findFirst({
      where: and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.userId, user.id)
      ),
      with: {
        attendees: true,
        reminders: true,
      },
    });

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    return { success: true, event };
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch event',
    };
  }
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(
  eventData: Omit<NewCalendarEvent, 'userId'>,
  attendees?: Omit<NewCalendarAttendee, 'eventId'>[],
  reminders?: Omit<NewCalendarReminder, 'eventId'>[]
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Create the event
    const [newEvent] = await db
      .insert(calendarEvents)
      .values({
        ...eventData,
        userId: user.id,
      })
      .returning();

    // Add attendees if provided
    if (attendees && attendees.length > 0) {
      await db.insert(calendarAttendees).values(
        attendees.map((attendee) => ({
          ...attendee,
          eventId: newEvent.id,
        }))
      );
    }

    // Add reminders if provided
    if (reminders && reminders.length > 0) {
      await db.insert(calendarReminders).values(
        reminders.map((reminder) => ({
          ...reminder,
          eventId: newEvent.id,
        }))
      );
    }

    revalidatePath('/dashboard/calendar');
    return { success: true, eventId: newEvent.id };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create event',
    };
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  eventData: Partial<Omit<NewCalendarEvent, 'userId'>>,
  attendees?: Omit<NewCalendarAttendee, 'eventId'>[],
  reminders?: Omit<NewCalendarReminder, 'eventId'>[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const existingEvent = await db.query.calendarEvents.findFirst({
      where: and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.userId, user.id)
      ),
    });

    if (!existingEvent) {
      return { success: false, error: 'Event not found or unauthorized' };
    }

    // Update the event
    await db
      .update(calendarEvents)
      .set({
        ...eventData,
        updatedAt: new Date(),
      })
      .where(eq(calendarEvents.id, eventId));

    // Update attendees if provided
    if (attendees !== undefined) {
      // Delete existing attendees
      await db
        .delete(calendarAttendees)
        .where(eq(calendarAttendees.eventId, eventId));

      // Insert new attendees
      if (attendees.length > 0) {
        await db.insert(calendarAttendees).values(
          attendees.map((attendee) => ({
            ...attendee,
            eventId,
          }))
        );
      }
    }

    // Update reminders if provided
    if (reminders !== undefined) {
      // Delete existing reminders
      await db
        .delete(calendarReminders)
        .where(eq(calendarReminders.eventId, eventId));

      // Insert new reminders
      if (reminders.length > 0) {
        await db.insert(calendarReminders).values(
          reminders.map((reminder) => ({
            ...reminder,
            eventId,
          }))
        );
      }
    }

    revalidatePath('/dashboard/calendar');
    return { success: true };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update event',
    };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership and delete
    const result = await db
      .delete(calendarEvents)
      .where(
        and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, user.id))
      )
      .returning();

    if (result.length === 0) {
      return { success: false, error: 'Event not found or unauthorized' };
    }

    revalidatePath('/dashboard/calendar');
    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete event',
    };
  }
}

/**
 * Create a calendar event from an email
 */
export async function createEventFromEmail(
  emailId: string,
  eventData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    meetingUrl?: string;
    attendees?: string[];
  }
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Create the event linked to the email
    const attendeesList = eventData.attendees?.map((email) => ({
      email,
      name: email.split('@')[0], // Simple name extraction
    }));

    const result = await createCalendarEvent(
      {
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        location: eventData.location,
        meetingUrl: eventData.meetingUrl,
        isVirtual: !!eventData.meetingUrl,
        emailId,
        type: 'meeting',
        createdBy: 'ai', // Indicate this was AI-detected
      },
      attendeesList,
      [
        // Default reminders
        { minutesBefore: 15, method: 'email' },
      ]
    );

    return result;
  } catch (error) {
    console.error('Error creating event from email:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create event from email',
    };
  }
}

/**
 * Get events linked to an email thread
 */
export async function getEventsForEmailThread(
  threadId: string
): Promise<{ success: boolean; events?: CalendarEvent[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const events = await db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.userId, user.id),
        eq(calendarEvents.emailThreadId, threadId)
      ),
      orderBy: [asc(calendarEvents.startTime)],
    });

    return { success: true, events };
  } catch (error) {
    console.error('Error fetching events for email thread:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch events',
    };
  }
}

