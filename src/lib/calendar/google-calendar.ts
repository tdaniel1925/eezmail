/**
 * Google Calendar Integration
 * OAuth 2.0 and Calendar API sync
 */

'use server';

import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { externalCalendars, calendarEvents, calendarAttendees } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL + '/api/auth/google/callback'
);

/**
 * Generate Google OAuth URL for calendar access
 */
export async function getGoogleAuthUrl(): Promise<{ url: string }> {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  return { url };
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return { success: false, error: 'No access token received' };
    }

    // Store tokens in database
    await db.insert(externalCalendars).values({
      userId: user.id,
      provider: 'google',
      calendarId: 'primary', // Google primary calendar
      calendarName: 'Google Calendar',
      syncEnabled: true,
      syncDirection: 'bidirectional',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });

    return { success: true };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect Google Calendar',
    };
  }
}

/**
 * Refresh access token
 */
async function refreshAccessToken(
  calendar: typeof externalCalendars.$inferSelect
): Promise<string | null> {
  if (!calendar.refreshToken) {
    return null;
  }

  try {
    oauth2Client.setCredentials({
      refresh_token: calendar.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      return null;
    }

    // Update tokens in database
    await db
      .update(externalCalendars)
      .set({
        accessToken: credentials.access_token,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      })
      .where(eq(externalCalendars.id, calendar.id));

    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Get authorized Google Calendar API client
 */
async function getGoogleCalendarClient(calendar: typeof externalCalendars.$inferSelect) {
  let accessToken = calendar.accessToken;

  // Check if token is expired
  if (calendar.tokenExpiry && new Date() >= calendar.tokenExpiry) {
    accessToken = await refreshAccessToken(calendar);
    if (!accessToken) {
      throw new Error('Failed to refresh access token');
    }
  }

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: calendar.refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Sync events from Google Calendar
 */
export async function syncFromGoogleCalendar(): Promise<{
  success: boolean;
  synced?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get Google calendar connection
    const [calendar] = await db
      .select()
      .from(externalCalendars)
      .where(
        and(
          eq(externalCalendars.userId, user.id),
          eq(externalCalendars.provider, 'google'),
          eq(externalCalendars.syncEnabled, true)
        )
      )
      .limit(1);

    if (!calendar) {
      return { success: false, error: 'Google Calendar not connected' };
    }

    const gcal = await getGoogleCalendarClient(calendar);

    // Fetch events from Google Calendar
    const response = await gcal.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
      syncToken: calendar.syncToken || undefined,
    });

    let syncedCount = 0;

    if (response.data.items) {
      for (const item of response.data.items) {
        if (!item.start?.dateTime || !item.end?.dateTime) continue;

        // Check if event already exists
        const [existing] = await db
          .select()
          .from(calendarEvents)
          .where(
            and(
              eq(calendarEvents.userId, user.id),
              eq(calendarEvents.externalEventId, item.id!)
            )
          )
          .limit(1);

        const eventData = {
          userId: user.id,
          title: item.summary || 'Untitled Event',
          description: item.description || undefined,
          startTime: new Date(item.start.dateTime),
          endTime: new Date(item.end.dateTime),
          location: item.location || undefined,
          isVirtual: !!item.hangoutLink || !!item.conferenceData,
          meetingUrl: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri || undefined,
          type: 'meeting' as const,
          externalEventId: item.id!,
          externalCalendarId: 'primary',
          externalProvider: 'google' as const,
          createdBy: 'sync',
        };

        if (existing) {
          // Update existing event
          await db
            .update(calendarEvents)
            .set(eventData)
            .where(eq(calendarEvents.id, existing.id));
        } else {
          // Create new event
          const [newEvent] = await db.insert(calendarEvents).values(eventData).returning();

          // Add attendees
          if (item.attendees && item.attendees.length > 0) {
            await db.insert(calendarAttendees).values(
              item.attendees.map((attendee) => ({
                eventId: newEvent.id,
                email: attendee.email!,
                name: attendee.displayName || attendee.email!.split('@')[0],
                responseStatus:
                  attendee.responseStatus === 'accepted'
                    ? ('accepted' as const)
                    : attendee.responseStatus === 'declined'
                      ? ('declined' as const)
                      : attendee.responseStatus === 'tentative'
                        ? ('tentative' as const)
                        : ('pending' as const),
                isOrganizer: attendee.organizer || false,
              }))
            );
          }

          syncedCount++;
        }
      }
    }

    // Update sync token
    if (response.data.nextSyncToken) {
      await db
        .update(externalCalendars)
        .set({
          syncToken: response.data.nextSyncToken,
          lastSyncAt: new Date(),
        })
        .where(eq(externalCalendars.id, calendar.id));
    }

    return { success: true, synced: syncedCount };
  } catch (error) {
    console.error('Error syncing from Google Calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync from Google Calendar',
    };
  }
}

/**
 * Push local event to Google Calendar
 */
export async function pushToGoogleCalendar(
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

    // Get event
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, user.id)))
      .limit(1);

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    // Get Google calendar connection
    const [calendar] = await db
      .select()
      .from(externalCalendars)
      .where(
        and(
          eq(externalCalendars.userId, user.id),
          eq(externalCalendars.provider, 'google'),
          eq(externalCalendars.syncEnabled, true)
        )
      )
      .limit(1);

    if (!calendar) {
      return { success: false, error: 'Google Calendar not connected' };
    }

    const gcal = await getGoogleCalendarClient(calendar);

    const googleEvent = {
      summary: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: event.timezone || 'UTC',
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: event.timezone || 'UTC',
      },
    };

    if (event.externalEventId) {
      // Update existing event
      await gcal.events.update({
        calendarId: 'primary',
        eventId: event.externalEventId,
        requestBody: googleEvent,
      });
    } else {
      // Create new event
      const response = await gcal.events.insert({
        calendarId: 'primary',
        requestBody: googleEvent,
      });

      // Save external event ID
      await db
        .update(calendarEvents)
        .set({
          externalEventId: response.data.id!,
          externalCalendarId: 'primary',
          externalProvider: 'google',
        })
        .where(eq(calendarEvents.id, eventId));
    }

    return { success: true };
  } catch (error) {
    console.error('Error pushing to Google Calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to push to Google Calendar',
    };
  }
}

