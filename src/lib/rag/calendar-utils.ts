/**
 * Calendar Search Utils
 * Pure utility functions for date/time parsing
 */

/**
 * Parse natural language date/time expressions
 */
export function parseNaturalDateTime(input: string): {
  startDate?: Date;
  endDate?: Date;
} {
  const lower = input.toLowerCase();
  const now = new Date();

  // Today
  if (lower.includes('today')) {
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  // Tomorrow
  if (lower.includes('tomorrow')) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  // This week
  if (lower.includes('this week')) {
    const startDate = new Date(now);
    const dayOfWeek = startDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + daysToMonday);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  // Next week
  if (lower.includes('next week')) {
    const startDate = new Date(now);
    const dayOfWeek = startDate.getDay();
    const daysToNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    startDate.setDate(startDate.getDate() + daysToNextMonday);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  // This month
  if (lower.includes('this month')) {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  // Default: no specific date range
  return {};
}
