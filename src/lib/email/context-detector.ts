import type { Email } from '@/db/schema';

export interface ContextualAction {
  type:
    | 'calendar'
    | 'contact'
    | 'reminder'
    | 'task'
    | 'reply'
    | 'forward'
    | 'archive';
  label: string;
  description?: string;
  data?: Record<string, any>;
}

const MEETING_KEYWORDS = [
  'meeting',
  'calendar',
  'schedule',
  'appointment',
  'call',
  'zoom',
  'teams',
  'conference',
  'invite',
  'rsvp',
  'at',
  'pm',
  'am',
  'today',
  'tomorrow',
  'next week',
];

const CONTACT_KEYWORDS = [
  'contact',
  'phone',
  'address',
  'meet',
  'introduce',
  'connection',
  'reach out',
  'connect with',
];

const TASK_KEYWORDS = [
  'todo',
  'task',
  'deadline',
  'complete',
  'finish',
  'submit',
  'deliverable',
  'action item',
  'follow up',
];

const URGENT_KEYWORDS = [
  'urgent',
  'asap',
  'important',
  'priority',
  'critical',
  'immediately',
  'time-sensitive',
];

/**
 * Detect contextual actions for an email using fast keyword detection
 */
export function detectEmailContext(email: Email): ContextualAction[] {
  const actions: ContextualAction[] = [];
  const text = `${email.subject || ''} ${email.bodyText || ''}`.toLowerCase();

  // Check for meeting/calendar keywords
  const meetingScore = MEETING_KEYWORDS.filter((kw) =>
    text.includes(kw)
  ).length;
  if (meetingScore >= 2) {
    actions.push({
      type: 'calendar',
      label: 'Add to Calendar',
      description: 'Create a calendar event from this email',
    });
  }

  // Check for contact keywords
  const contactScore = CONTACT_KEYWORDS.filter((kw) =>
    text.includes(kw)
  ).length;
  if (contactScore >= 2) {
    actions.push({
      type: 'contact',
      label: 'Save Contact',
      description: 'Add sender to contacts',
    });
  }

  // Check for task keywords
  const taskScore = TASK_KEYWORDS.filter((kw) => text.includes(kw)).length;
  if (taskScore >= 2) {
    actions.push({
      type: 'task',
      label: 'Create Task',
      description: 'Add this as a task',
    });
  }

  // Check for urgency
  const urgentScore = URGENT_KEYWORDS.filter((kw) => text.includes(kw)).length;
  if (urgentScore >= 1) {
    actions.push({
      type: 'reminder',
      label: 'Set Reminder',
      description: 'Set a reminder for this email',
    });
  }

  // Always offer reply
  if (email.fromAddress) {
    actions.push({
      type: 'reply',
      label: 'Quick Reply',
      description: 'Reply to this email',
    });
  }

  // Dedup actions
  const uniqueActions = actions.filter(
    (action, index, self) =>
      index === self.findIndex((a) => a.type === action.type)
  );

  return uniqueActions;
}

/**
 * Extract meeting details from email text
 */
export function extractMeetingDetails(email: Email): {
  title?: string;
  date?: Date;
  time?: string;
  location?: string;
} | null {
  const text = `${email.subject || ''} ${email.bodyText || ''}`;

  // Try to extract date/time patterns
  const datePattern =
    /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|january|february|march|april|may|june|july|august|september|october|november|december)/gi;
  const timePattern = /(\d{1,2}:\d{2}\s*(am|pm)?|\d{1,2}\s*(am|pm))/gi;

  const dateMatch = text.match(datePattern);
  const timeMatch = text.match(timePattern);

  if (dateMatch || timeMatch) {
    return {
      title: email.subject,
      date: dateMatch ? new Date(dateMatch[0]) : undefined,
      time: timeMatch ? timeMatch[0] : undefined,
    };
  }

  return null;
}

/**
 * Extract contact information from email
 */
export function extractContactInfo(email: Email): {
  name?: string;
  email?: string;
  phone?: string;
} {
  const phonePattern =
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const text = `${email.bodyText || ''}`;

  const phoneMatch = text.match(phonePattern);

  return {
    name: email.fromAddress?.name,
    email: email.fromAddress?.email,
    phone: phoneMatch ? phoneMatch[0] : undefined,
  };
}
