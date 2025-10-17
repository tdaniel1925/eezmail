/**
 * Natural language date/time parser
 * Converts phrases like "tomorrow at 2pm" into Date objects
 */

export function parseDateTime(input: string): Date | null {
  try {
    const now = new Date();
    const lowerInput = input.toLowerCase().trim();

    // Today
    if (lowerInput.includes('today')) {
      return extractTime(lowerInput, now);
    }

    // Tomorrow
    if (lowerInput.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return extractTime(lowerInput, tomorrow);
    }

    // Yesterday
    if (lowerInput.includes('yesterday')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return extractTime(lowerInput, yesterday);
    }

    // Next week
    if (lowerInput.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return extractTime(lowerInput, nextWeek);
    }

    // Days of week (next Monday, this Friday, etc.)
    const dayMatch = lowerInput.match(
      /(?:next|this)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
    );
    if (dayMatch) {
      const targetDay = dayMatch[1].toLowerCase();
      const dayIndex = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ].indexOf(targetDay);
      const currentDayIndex = now.getDay();

      let daysToAdd = dayIndex - currentDayIndex;
      if (daysToAdd <= 0 || lowerInput.includes('next')) {
        daysToAdd += 7;
      }

      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      return extractTime(lowerInput, targetDate);
    }

    // "In X days/hours/minutes"
    const inMatch = lowerInput.match(
      /in\s+(\d+)\s+(day|days|hour|hours|minute|minutes)/
    );
    if (inMatch) {
      const amount = parseInt(inMatch[1]);
      const unit = inMatch[2];
      const targetDate = new Date(now);

      if (unit.startsWith('day')) {
        targetDate.setDate(targetDate.getDate() + amount);
      } else if (unit.startsWith('hour')) {
        targetDate.setHours(targetDate.getHours() + amount);
      } else if (unit.startsWith('minute')) {
        targetDate.setMinutes(targetDate.getMinutes() + amount);
      }

      return targetDate;
    }

    // Specific date formats: "December 15", "Dec 15th", "12/15", "2024-12-15"
    const dateFormats = [
      /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/, // MM/DD or MM/DD/YYYY
      /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?/i, // Month Day Year
    ];

    for (const regex of dateFormats) {
      const match = lowerInput.match(regex);
      if (match) {
        let month, day, year;

        if (match[0].includes('/')) {
          // MM/DD format
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          year = match[3] ? parseInt(match[3]) : now.getFullYear();
          if (year < 100) year += 2000;
        } else {
          // Month name format
          const monthNames = [
            'january',
            'february',
            'march',
            'april',
            'may',
            'june',
            'july',
            'august',
            'september',
            'october',
            'november',
            'december',
          ];
          const shortMonths = [
            'jan',
            'feb',
            'mar',
            'apr',
            'may',
            'jun',
            'jul',
            'aug',
            'sep',
            'oct',
            'nov',
            'dec',
          ];
          const monthStr = match[1].toLowerCase();
          month = monthNames.indexOf(monthStr);
          if (month === -1)
            month = shortMonths.indexOf(monthStr.substring(0, 3));
          day = parseInt(match[2]);
          year = match[3] ? parseInt(match[3]) : now.getFullYear();
        }

        const targetDate = new Date(year, month, day);
        return extractTime(lowerInput, targetDate);
      }
    }

    // If no pattern matched, try native Date parsing as fallback
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Extract time from input string and apply to date
 */
function extractTime(input: string, baseDate: Date): Date {
  const result = new Date(baseDate);

  // Match time patterns: "2pm", "2:30pm", "14:30", "2:30 PM"
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i, // 2:30pm or 14:30
    /(\d{1,2})\s*(am|pm)/i, // 2pm
  ];

  for (const pattern of timePatterns) {
    const match = input.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const meridiem = match[3] || match[2];

      // Convert to 24-hour format
      if (meridiem) {
        const isPM = meridiem.toLowerCase() === 'pm';
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
      }

      result.setHours(hours, minutes, 0, 0);
      return result;
    }
  }

  // If no time specified, default to 9am for future dates
  if (baseDate.getDate() !== new Date().getDate()) {
    result.setHours(9, 0, 0, 0);
  }

  return result;
}

/**
 * Parse duration into minutes
 */
export function parseDuration(input: string): number {
  const lowerInput = input.toLowerCase().trim();

  // Match patterns like "30 minutes", "1 hour", "2 hours 30 minutes"
  const patterns = [
    { regex: /(\d+)\s*hours?\s*(\d+)?\s*minutes?/, hours: 1, minutes: 2 },
    { regex: /(\d+)\s*hours?/, hours: 1 },
    { regex: /(\d+)\s*minutes?/, minutes: 1 },
    { regex: /(\d+)\s*mins?/, minutes: 1 },
  ];

  for (const pattern of patterns) {
    const match = lowerInput.match(pattern.regex);
    if (match) {
      let totalMinutes = 0;
      if (pattern.hours && match[pattern.hours]) {
        totalMinutes += parseInt(match[pattern.hours]) * 60;
      }
      if (pattern.minutes && match[pattern.minutes]) {
        totalMinutes += parseInt(match[pattern.minutes]);
      }
      return totalMinutes;
    }
  }

  // Default: if just a number, assume minutes
  const numberMatch = lowerInput.match(/^(\d+)$/);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }

  // Default to 60 minutes (1 hour)
  return 60;
}

/**
 * Format date for display
 */
export function formatDateTime(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diffDays = Math.floor(
    (targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  let dateStr: string;
  if (diffDays === 0) {
    dateStr = 'Today';
  } else if (diffDays === 1) {
    dateStr = 'Tomorrow';
  } else if (diffDays === -1) {
    dateStr = 'Yesterday';
  } else if (diffDays < 7 && diffDays > 0) {
    dateStr = date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: date.getMinutes() > 0 ? '2-digit' : undefined,
    hour12: true,
  });

  return `${dateStr} at ${timeStr}`;
}

