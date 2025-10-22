/**
 * Recurring Events Support with RRULE
 * Implements RFC 5545 recurrence rules for calendar events
 */

import { RRule, rrulestr } from 'rrule';
import type { CalendarEvent } from '@/db/schema';

export interface RecurrenceOptions {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number; // Every N days/weeks/months/years
  count?: number; // Number of occurrences
  until?: Date; // End date
  byweekday?: number[]; // Days of week (0=Monday, 6=Sunday)
  bymonthday?: number; // Day of month
  bymonth?: number; // Month (1-12)
}

/**
 * Generate RRULE string from options
 */
export function generateRRule(options: RecurrenceOptions, startDate: Date): string {
  const freq = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY,
    yearly: RRule.YEARLY,
  }[options.frequency];

  const ruleOptions: any = {
    freq,
    dtstart: startDate,
    interval: options.interval || 1,
  };

  if (options.count) {
    ruleOptions.count = options.count;
  } else if (options.until) {
    ruleOptions.until = options.until;
  }

  if (options.byweekday) {
    ruleOptions.byweekday = options.byweekday;
  }

  if (options.bymonthday) {
    ruleOptions.bymonthday = options.bymonthday;
  }

  if (options.bymonth) {
    ruleOptions.bymonth = options.bymonth;
  }

  const rule = new RRule(ruleOptions);
  return rule.toString();
}

/**
 * Parse RRULE string and get human-readable description
 */
export function describeRRule(rruleString: string): string {
  try {
    const rule = rrulestr(rruleString);
    return rule.toText();
  } catch (error) {
    console.error('Error parsing RRULE:', error);
    return 'Invalid recurrence rule';
  }
}

/**
 * Generate occurrences of a recurring event within a date range
 */
export function generateOccurrences(
  event: CalendarEvent,
  startDate: Date,
  endDate: Date
): Array<{ date: Date; isException: boolean }> {
  if (!event.isRecurring || !event.recurrenceRule) {
    return [];
  }

  try {
    const rule = rrulestr(event.recurrenceRule);
    const occurrences = rule.between(startDate, endDate, true);

    return occurrences.map((date) => ({
      date,
      isException: false, // TODO: Check against exception dates
    }));
  } catch (error) {
    console.error('Error generating occurrences:', error);
    return [];
  }
}

/**
 * Check if a date is an occurrence of a recurring event
 */
export function isOccurrence(
  event: CalendarEvent,
  date: Date
): boolean {
  if (!event.isRecurring || !event.recurrenceRule) {
    return false;
  }

  try {
    const rule = rrulestr(event.recurrenceRule);
    // Check if date is on or after start
    if (date < new Date(event.startTime)) {
      return false;
    }

    // Check if date matches recurrence pattern
    const nextOccurrence = rule.after(new Date(date.getTime() - 1), true);
    if (!nextOccurrence) return false;

    // Check if dates match (ignoring time)
    return (
      nextOccurrence.getFullYear() === date.getFullYear() &&
      nextOccurrence.getMonth() === date.getMonth() &&
      nextOccurrence.getDate() === date.getDate()
    );
  } catch (error) {
    console.error('Error checking occurrence:', error);
    return false;
  }
}

/**
 * Get the next occurrence of a recurring event after a given date
 */
export function getNextOccurrence(
  event: CalendarEvent,
  afterDate: Date = new Date()
): Date | null {
  if (!event.isRecurring || !event.recurrenceRule) {
    return null;
  }

  try {
    const rule = rrulestr(event.recurrenceRule);
    return rule.after(afterDate, false);
  } catch (error) {
    console.error('Error getting next occurrence:', error);
    return null;
  }
}

/**
 * Common recurrence patterns for quick selection
 */
export const COMMON_PATTERNS = {
  daily: {
    label: 'Daily',
    rrule: (start: Date) =>
      generateRRule({ frequency: 'daily', interval: 1 }, start),
  },
  weekdays: {
    label: 'Every weekday (Mon-Fri)',
    rrule: (start: Date) =>
      generateRRule(
        { frequency: 'weekly', interval: 1, byweekday: [0, 1, 2, 3, 4] },
        start
      ),
  },
  weekly: {
    label: 'Weekly',
    rrule: (start: Date) =>
      generateRRule({ frequency: 'weekly', interval: 1 }, start),
  },
  biweekly: {
    label: 'Every 2 weeks',
    rrule: (start: Date) =>
      generateRRule({ frequency: 'weekly', interval: 2 }, start),
  },
  monthly: {
    label: 'Monthly',
    rrule: (start: Date) =>
      generateRRule({ frequency: 'monthly', interval: 1 }, start),
  },
  yearly: {
    label: 'Yearly',
    rrule: (start: Date) =>
      generateRRule({ frequency: 'yearly', interval: 1 }, start),
  },
};

/**
 * Validate RRULE string
 */
export function validateRRule(rruleString: string): {
  valid: boolean;
  error?: string;
} {
  try {
    rrulestr(rruleString);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid RRULE format',
    };
  }
}

