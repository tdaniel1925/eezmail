/**
 * Reference Resolver Utils
 * Pure utility functions for reference detection
 */

/**
 * Check if message contains references that need resolution
 */
export function containsReferences(message: string): boolean {
  const referencePatterns = [
    /\b(it|this|that)\b/i,
    /\b(him|her|them|his|hers|their)\b/i,
    /\b(that email|the email|this email)\b/i,
    /\b(that meeting|the meeting|this meeting)\b/i,
    /\b(that task|the task|this task)\b/i,
  ];

  return referencePatterns.some((pattern) => pattern.test(message));
}
