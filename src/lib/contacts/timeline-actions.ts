'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { contactTimeline } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface TimelineEvent {
  id: string;
  contactId: string;
  userId: string;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface NewTimelineEvent {
  eventType: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get timeline events for a contact
 */
export async function getContactTimeline(
  contactId: string,
  eventTypeFilter?: string
): Promise<{ success: boolean; events?: TimelineEvent[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const whereConditions = [
      eq(contactTimeline.contactId, contactId),
      eq(contactTimeline.userId, user.id),
    ];

    if (eventTypeFilter) {
      whereConditions.push(
        eq(contactTimeline.eventType, eventTypeFilter as any)
      );
    }

    const events = await db.query.contactTimeline.findMany({
      where: and(...whereConditions),
      orderBy: [desc(contactTimeline.createdAt)],
      limit: 100, // Limit to last 100 events
    });

    return {
      success: true,
      events: events.map((event) => ({
        id: event.id,
        contactId: event.contactId,
        userId: event.userId,
        eventType: event.eventType,
        title: event.title,
        description: event.description,
        metadata: event.metadata as Record<string, unknown> | null,
        createdAt: event.createdAt,
      })),
    };
  } catch (error) {
    console.error('Error fetching contact timeline:', error);
    return { success: false, error: 'Failed to fetch timeline events' };
  }
}

/**
 * Add a timeline event for a contact
 */
export async function addTimelineEvent(
  contactId: string,
  event: NewTimelineEvent
): Promise<{ success: boolean; event?: TimelineEvent; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!event.title.trim()) {
      return { success: false, error: 'Event title cannot be empty' };
    }

    const [newEvent] = await db
      .insert(contactTimeline)
      .values({
        contactId,
        userId: user.id,
        eventType: event.eventType as any,
        title: event.title.trim(),
        description: event.description || null,
        metadata: event.metadata || null,
      })
      .returning();

    // Revalidate the contact page
    revalidatePath(`/dashboard/contacts/${contactId}`);

    return {
      success: true,
      event: {
        id: newEvent.id,
        contactId: newEvent.contactId,
        userId: newEvent.userId,
        eventType: newEvent.eventType,
        title: newEvent.title,
        description: newEvent.description,
        metadata: newEvent.metadata as Record<string, unknown> | null,
        createdAt: newEvent.createdAt,
      },
    };
  } catch (error) {
    console.error('Error adding timeline event:', error);
    return { success: false, error: 'Failed to add timeline event' };
  }
}

/**
 * Auto-log an email sent event
 */
export async function logEmailSent(
  contactId: string,
  emailSubject: string,
  emailId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await addTimelineEvent(contactId, {
    eventType: 'email_sent',
    title: `Sent: ${emailSubject}`,
    description: `Email sent to contact`,
    metadata: { emailId, subject: emailSubject },
  });

  return { success: result.success, error: result.error };
}

/**
 * Auto-log an email received event
 */
export async function logEmailReceived(
  contactId: string,
  emailSubject: string,
  emailId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await addTimelineEvent(contactId, {
    eventType: 'email_received',
    title: `Received: ${emailSubject}`,
    description: `Email received from contact`,
    metadata: { emailId, subject: emailSubject },
  });

  return { success: result.success, error: result.error };
}

/**
 * Auto-log a voice message sent event
 */
export async function logVoiceMessageSent(
  contactId: string,
  duration?: number
): Promise<{ success: boolean; error?: string }> {
  const result = await addTimelineEvent(contactId, {
    eventType: 'voice_message_sent',
    title: 'Sent voice message',
    description: duration
      ? `Voice message sent (${Math.round(duration)}s)`
      : 'Voice message sent',
    metadata: duration ? { duration } : undefined,
  });

  return { success: result.success, error: result.error };
}

/**
 * Auto-log a meeting scheduled event
 */
export async function logMeetingScheduled(
  contactId: string,
  meetingTitle: string,
  meetingDate: Date
): Promise<{ success: boolean; error?: string }> {
  const result = await addTimelineEvent(contactId, {
    eventType: 'meeting_scheduled',
    title: `Scheduled: ${meetingTitle}`,
    description: `Meeting scheduled for ${meetingDate.toLocaleDateString()}`,
    metadata: { meetingTitle, meetingDate: meetingDate.toISOString() },
  });

  return { success: result.success, error: result.error };
}

/**
 * Auto-log a document shared event
 */
export async function logDocumentShared(
  contactId: string,
  fileName: string,
  documentId?: string
): Promise<{ success: boolean; error?: string }> {
  const result = await addTimelineEvent(contactId, {
    eventType: 'document_shared',
    title: `Shared: ${fileName}`,
    description: `Document shared with contact`,
    metadata: { fileName, documentId },
  });

  return { success: result.success, error: result.error };
}

/**
 * Auto-log a contact created event
 */
export async function logContactCreated(
  contactId: string,
  source: 'manual' | 'email' | 'import' | 'other' = 'manual',
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const sourceDescriptions = {
    manual: 'Manually added to contacts',
    email: 'Added from email exchange',
    import: 'Imported from file',
    other: 'Added to contacts',
  };

  const result = await addTimelineEvent(contactId, {
    eventType: 'contact_created',
    title: 'Contact created',
    description: sourceDescriptions[source],
    metadata: { source, createdAt: new Date().toISOString(), ...metadata },
  });

  return { success: result.success, error: result.error };
}
