/**
 * Microsoft Calendar Integration
 * OAuth 2.0 and Microsoft Graph Calendar API sync
 */

'use server';

import { Client } from '@microsoft/microsoft-graph-client';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { externalCalendars, calendarEvents, calendarAttendees } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

/**
 * Generate Microsoft OAuth URL for calendar access
 */
export async function getMicrosoftAuthUrl(): Promise<{ url: string }> {
  const scopes = 'Calendars.ReadWrite offline_access';

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.NEXT_PUBLIC_APP_URL! + '/api/auth/microsoft/callback',
    scope: scopes,
    response_mode: 'query',
  });

  return { url: `${MICROSOFT_AUTH_URL}?${params.toString()}` };
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeMicrosoftCodeForTokens(code: string): Promise<{
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

    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.NEXT_PUBLIC_APP_URL! + '/api/auth/microsoft/callback',
      grant_type: 'authorization_code',
    });

    const response = await fetch(MICROSOFT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await response.json();

    // Store tokens in database
    await db.insert(externalCalendars).values({
      userId: user.id,
      provider: 'microsoft',
      calendarId: 'primary',
      calendarName: 'Microsoft Calendar',
      syncEnabled: true,
      syncDirection: 'bidirectional',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
    });

    return { success: true };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect Microsoft Calendar',
    };
  }
}

/**
 * Refresh access token
 */
async function refreshMicrosoftAccessToken(
  calendar: typeof externalCalendars.$inferSelect
): Promise<string | null> {
  if (!calendar.refreshToken) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: calendar.refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(MICROSOFT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      return null;
    }

    const tokens = await response.json();

    // Update tokens in database
    await db
      .update(externalCalendars)
      .set({
        accessToken: tokens.access_token,
        tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      })
      .where(eq(externalCalendars.id, calendar.id));

    return tokens.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Get authorized Microsoft Graph client
 */
async function getMicrosoftGraphClient(calendar: typeof externalCalendars.$inferSelect) {
  let accessToken = calendar.accessToken;

  // Check if token is expired
  if (calendar.tokenExpiry && new Date() >= calendar.tokenExpiry) {
    accessToken = await refreshMicrosoftAccessToken(calendar);
    if (!accessToken) {
      throw new Error('Failed to refresh access token');
    }
  }

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * Sync events from Microsoft Calendar
 */
export async function syncFromMicrosoftCalendar(): Promise<{
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

    // Get Microsoft calendar connection
    const [calendar] = await db
      .select()
      .from(externalCalendars)
      .where(
        and(
          eq(externalCalendars.userId, user.id),
          eq(externalCalendars.provider, 'microsoft'),
          eq(externalCalendars.syncEnabled, true)
        )
      )
      .limit(1);

    if (!calendar) {
      return { success: false, error: 'Microsoft Calendar not connected' };
    }

    const client = await getMicrosoftGraphClient(calendar);

    // Fetch events from Microsoft Calendar
    const response = await client
      .api('/me/calendar/events')
      .top(100)
      .orderby('start/dateTime')
      .select('id,subject,start,end,location,bodyPreview,attendees,isOnlineMeeting,onlineMeetingUrl')
      .get();

    let syncedCount = 0;

    if (response.value) {
      for (const item of response.value) {
        if (!item.start?.dateTime || !item.end?.dateTime) continue;

        // Check if event already exists
        const [existing] = await db
          .select()
          .from(calendarEvents)
          .where(
            and(
              eq(calendarEvents.userId, user.id),
              eq(calendarEvents.externalEventId, item.id)
            )
          )
          .limit(1);

        const eventData = {
          userId: user.id,
          title: item.subject || 'Untitled Event',
          description: item.bodyPreview || undefined,
          startTime: new Date(item.start.dateTime),
          endTime: new Date(item.end.dateTime),
          location: item.location?.displayName || undefined,
          isVirtual: item.isOnlineMeeting || false,
          meetingUrl: item.onlineMeetingUrl || undefined,
          type: 'meeting' as const,
          externalEventId: item.id,
          externalCalendarId: 'primary',
          externalProvider: 'microsoft' as const,
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
              item.attendees.map((attendee: any) => ({
                eventId: newEvent.id,
                email: attendee.emailAddress?.address || '',
                name: attendee.emailAddress?.name || attendee.emailAddress?.address?.split('@')[0] || '',
                responseStatus:
                  attendee.status?.response === 'accepted'
                    ? ('accepted' as const)
                    : attendee.status?.response === 'declined'
                      ? ('declined' as const)
                      : attendee.status?.response === 'tentativelyAccepted'
                        ? ('tentative' as const)
                        : ('pending' as const),
                isOrganizer: attendee.type === 'organizer',
              }))
            );
          }

          syncedCount++;
        }
      }
    }

    // Update last sync time
    await db
      .update(externalCalendars)
      .set({
        lastSyncAt: new Date(),
      })
      .where(eq(externalCalendars.id, calendar.id));

    return { success: true, synced: syncedCount };
  } catch (error) {
    console.error('Error syncing from Microsoft Calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync from Microsoft Calendar',
    };
  }
}

/**
 * Push local event to Microsoft Calendar
 */
export async function pushToMicrosoftCalendar(
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

    // Get Microsoft calendar connection
    const [calendar] = await db
      .select()
      .from(externalCalendars)
      .where(
        and(
          eq(externalCalendars.userId, user.id),
          eq(externalCalendars.provider, 'microsoft'),
          eq(externalCalendars.syncEnabled, true)
        )
      )
      .limit(1);

    if (!calendar) {
      return { success: false, error: 'Microsoft Calendar not connected' };
    }

    const client = await getMicrosoftGraphClient(calendar);

    const msEvent = {
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || '',
      },
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: event.timezone || 'UTC',
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: event.timezone || 'UTC',
      },
      location: event.location ? {
        displayName: event.location,
      } : undefined,
    };

    if (event.externalEventId) {
      // Update existing event
      await client.api(`/me/calendar/events/${event.externalEventId}`).update(msEvent);
    } else {
      // Create new event
      const response = await client.api('/me/calendar/events').post(msEvent);

      // Save external event ID
      await db
        .update(calendarEvents)
        .set({
          externalEventId: response.id,
          externalCalendarId: 'primary',
          externalProvider: 'microsoft',
        })
        .where(eq(calendarEvents.id, eventId));
    }

    return { success: true };
  } catch (error) {
    console.error('Error pushing to Microsoft Calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to push to Microsoft Calendar',
    };
  }
}

