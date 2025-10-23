/**
 * Meeting Detection Utilities
 * Synchronous helper functions for meeting detection
 */

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
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Helper: Convert time to 24-hour format
 */
export function convertToTime24(time: string): string {
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
export function parseDuration(duration?: string): number | null {
  if (!duration) return null;

  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minMatch = duration.match(/(\d+)\s*m/i);

  let minutes = 0;
  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) minutes += parseInt(minMatch[1]);

  return minutes || null;
}

