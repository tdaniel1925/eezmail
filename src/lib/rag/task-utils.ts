/**
 * Task Search Utils
 * Pure utility functions for task parsing
 */

/**
 * Parse natural language task priorities
 */
export function parseTaskPriority(
  input: string
): 'high' | 'medium' | 'low' | undefined {
  const lower = input.toLowerCase();

  if (
    lower.includes('urgent') ||
    lower.includes('critical') ||
    lower.includes('high priority')
  ) {
    return 'high';
  }

  if (
    lower.includes('low') ||
    lower.includes('minor') ||
    lower.includes('low priority')
  ) {
    return 'low';
  }

  if (lower.includes('medium') || lower.includes('normal')) {
    return 'medium';
  }

  return undefined;
}

/**
 * Parse task status from natural language
 */
export function parseTaskStatus(
  input: string
): 'pending' | 'in_progress' | 'completed' | undefined {
  const lower = input.toLowerCase();

  if (
    lower.includes('done') ||
    lower.includes('completed') ||
    lower.includes('finished')
  ) {
    return 'completed';
  }

  if (lower.includes('in progress') || lower.includes('working on')) {
    return 'in_progress';
  }

  if (
    lower.includes('pending') ||
    lower.includes('todo') ||
    lower.includes('not started')
  ) {
    return 'pending';
  }

  return undefined;
}
