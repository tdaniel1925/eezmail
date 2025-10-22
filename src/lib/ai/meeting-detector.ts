/**
 * Meeting Detection Engine
 * Detects meetings in emails and extracts details using AI
 */

'use server';

import OpenAI from 'openai';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MeetingDetails {
  detected: boolean;
  confidence: number; // 0-1
  title?: string;
  date?: string; // ISO date string
  time?: string;
  duration?: string;
  location?: string;
  attendees?: string[];
  agenda?: string;
  meetingType?: 'in-person' | 'video-call' | 'phone-call' | 'unknown';
  conferenceLink?: string;
  // Parsed datetime objects for easy use
  startTime?: Date;
  endTime?: Date;
}

/**
 * Detect if an email contains meeting information
 */
export async function detectMeetingInEmail(
  emailContent: string,
  subject?: string
): Promise<MeetingDetails> {
  const text = `Subject: ${subject || ''}\n\n${emailContent}`;

  // Quick keyword check first
  const meetingKeywords = [
    'meeting',
    'call',
    'schedule',
    'appointment',
    'zoom',
    'teams',
    'google meet',
    'conference',
    'discussion',
  ];

  const hasKeywords = meetingKeywords.some((keyword) =>
    text.toLowerCase().includes(keyword)
  );

  if (!hasKeywords) {
    return { detected: false, confidence: 0 };
  }

  try {
    // Use AI to extract meeting details
    const prompt = `Analyze this email and extract meeting information. If it contains meeting details, extract them. If not, return "no_meeting".

Email:
"""
${text.substring(0, 2000)}
"""

Extract:
1. Meeting detected? (yes/no)
2. Meeting title/purpose
3. Date (format: YYYY-MM-DD)
4. Time (format: HH:MM AM/PM with timezone if mentioned)
5. Duration
6. Location or conference link
7. Attendees (comma-separated emails)
8. Meeting type (in-person, video-call, phone-call)
9. Confidence (0-1)

Respond in JSON format:
{
  "detected": true/false,
  "confidence": 0.0-1.0,
  "title": "...",
  "date": "...",
  "time": "...",
  "duration": "...",
  "location": "...",
  "attendees": ["...", "..."],
  "meetingType": "...",
  "conferenceLink": "..."
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at extracting meeting information from emails. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    if (!response) {
      return { detected: false, confidence: 0 };
    }

    try {
      const parsed = JSON.parse(response);
      
      // Parse the start and end times
      let startTime: Date | undefined;
      let endTime: Date | undefined;
      
      if (parsed.date && parsed.time) {
        try {
          // Combine date and time
          const timeStr = convertToTime24(parsed.time);
          const dateTimeStr = `${parsed.date}T${timeStr}`;
          startTime = new Date(dateTimeStr);
          
          // Calculate end time
          const durationMinutes = parseDuration(parsed.duration) || 60;
          endTime = new Date(startTime.getTime() + durationMinutes * 60000);
        } catch (e) {
          console.error('Error parsing meeting date/time:', e);
        }
      }
      
      return {
        detected: parsed.detected || false,
        confidence: parsed.confidence || 0,
        title: parsed.title,
        date: parsed.date,
        time: parsed.time,
        duration: parsed.duration,
        location: parsed.location,
        attendees: parsed.attendees,
        agenda: parsed.agenda,
        meetingType: parsed.meetingType || 'unknown',
        conferenceLink: parsed.conferenceLink,
        startTime,
        endTime,
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return { detected: false, confidence: 0 };
    }
  } catch (error) {
    console.error('Error detecting meeting:', error);
    return { detected: false, confidence: 0 };
  }
}

/**
 * Detect meeting in an email by ID
 */
export async function detectMeetingInEmailById(
  emailId: string,
  userId: string
): Promise<MeetingDetails> {
  try {
    const [email] = await db
      .select({
        subject: emails.subject,
        bodyText: emails.bodyText,
        bodyHtml: emails.bodyHtml,
      })
      .from(emails)
      .where(eq(emails.id, emailId))
      .limit(1);

    if (!email) {
      return { detected: false, confidence: 0 };
    }

    const content = email.bodyText || stripHtml(email.bodyHtml || '');
    return detectMeetingInEmail(content, email.subject || undefined);
  } catch (error) {
    console.error('Error detecting meeting by email ID:', error);
    return { detected: false, confidence: 0 };
  }
}

/**
 * Generate calendar event from meeting details
 */
export async function generateCalendarEvent(
  meeting: MeetingDetails,
  emailSubject: string
): Promise<{
  title: string;
  start: string;
  end: string;
  description: string;
  location?: string;
}> {
  // Parse date and time
  const title = meeting.title || emailSubject || 'Meeting';
  const description = meeting.agenda || 'Meeting scheduled via email';

  // TODO: Better date/time parsing
  const start =
    meeting.date && meeting.time
      ? `${meeting.date}T${convertToTime24(meeting.time)}`
      : new Date().toISOString();

  // Calculate end time (default 1 hour if duration not specified)
  const durationMinutes = parseDuration(meeting.duration) || 60;
  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  const end = endDate.toISOString();

  return {
    title,
    start,
    end,
    description,
    location: meeting.location || meeting.conferenceLink,
  };
}

/**
 * Create ICS file content for calendar import
 */
export function generateICSFile(event: {
  title: string;
  start: string;
  end: string;
  description: string;
  location?: string;
}): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const start =
    new Date(event.start).toISOString().replace(/[-:]/g, '').split('.')[0] +
    'Z';
  const end =
    new Date(event.end).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Imbox Email Client//EN
BEGIN:VEVENT
UID:${Date.now()}@imbox.app
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
${event.location ? `LOCATION:${event.location}` : ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

/**
 * Helper: Strip HTML tags
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Helper: Convert time to 24-hour format
 */
function convertToTime24(time: string): string {
  // Simple conversion - in production, use a proper date library
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return '12:00';

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
}

/**
 * Helper: Parse duration to minutes
 */
function parseDuration(duration?: string): number | null {
  if (!duration) return null;

  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minMatch = duration.match(/(\d+)\s*m/i);

  let minutes = 0;
  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) minutes += parseInt(minMatch[1]);

  return minutes || null;
}
