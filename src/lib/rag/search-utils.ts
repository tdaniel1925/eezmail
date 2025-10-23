/**
 * Search Scope Utils
 * Pure utility functions for search optimization
 */

export interface OmniscientSearchOptions {
  includeEmails?: boolean;
  includeContacts?: boolean;
  includeCalendar?: boolean;
  includeTasks?: boolean;
  includeSettings?: boolean;
  emailLimit?: number;
  contactLimit?: number;
  calendarLimit?: number;
  taskLimit?: number;
}

/**
 * Determine what to search based on query intent
 * This helps optimize search performance
 */
export function inferSearchScope(query: string): OmniscientSearchOptions {
  const lower = query.toLowerCase();

  // Email-specific queries
  if (
    lower.includes('email') ||
    lower.includes('message') ||
    lower.includes('inbox') ||
    lower.includes('sent')
  ) {
    return {
      includeEmails: true,
      includeContacts: false,
      includeCalendar: false,
      includeTasks: false,
      includeSettings: false,
      emailLimit: 20,
    };
  }

  // Contact-specific queries
  if (
    lower.includes('contact') ||
    lower.includes('person') ||
    lower.includes('phone') ||
    lower.includes('address')
  ) {
    return {
      includeEmails: false,
      includeContacts: true,
      includeCalendar: false,
      includeTasks: false,
      includeSettings: false,
      contactLimit: 10,
    };
  }

  // Calendar-specific queries
  if (
    lower.includes('meeting') ||
    lower.includes('event') ||
    lower.includes('calendar') ||
    lower.includes('schedule')
  ) {
    return {
      includeEmails: false,
      includeContacts: false,
      includeCalendar: true,
      includeTasks: false,
      includeSettings: false,
      calendarLimit: 10,
    };
  }

  // Task-specific queries
  if (
    lower.includes('task') ||
    lower.includes('todo') ||
    lower.includes('reminder')
  ) {
    return {
      includeEmails: false,
      includeContacts: false,
      includeCalendar: false,
      includeTasks: true,
      includeSettings: false,
      taskLimit: 10,
    };
  }

  // Settings-specific queries
  if (
    lower.includes('setting') ||
    lower.includes('rule') ||
    lower.includes('signature') ||
    lower.includes('folder')
  ) {
    return {
      includeEmails: false,
      includeContacts: false,
      includeCalendar: false,
      includeTasks: false,
      includeSettings: true,
    };
  }

  // Default: search everything
  return {
    includeEmails: true,
    includeContacts: true,
    includeCalendar: true,
    includeTasks: true,
    includeSettings: true,
    emailLimit: 20,
    contactLimit: 10,
    calendarLimit: 10,
    taskLimit: 10,
  };
}
