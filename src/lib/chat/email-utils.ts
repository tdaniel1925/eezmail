/**
 * Email validation and parsing utilities
 * These are pure functions used by server actions
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Parse name and email from various formats
 * Examples:
 *   - "john@example.com"
 *   - "John Smith <john@example.com>"
 *   - "john@example.com (John Smith)"
 */
export function parseEmailAddress(input: string): {
  email: string;
  name?: string;
  isValid: boolean;
} {
  const trimmed = input.trim();

  // Format: "Name <email@example.com>"
  const bracketMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (bracketMatch) {
    const name = bracketMatch[1].trim().replace(/^["']|["']$/g, '');
    const email = bracketMatch[2].trim();
    return {
      email,
      name: name || undefined,
      isValid: isValidEmail(email),
    };
  }

  // Format: "email@example.com (Name)"
  const parenMatch = trimmed.match(/^([^\s]+)\s*\((.+?)\)$/);
  if (parenMatch) {
    const email = parenMatch[1].trim();
    const name = parenMatch[2].trim();
    return {
      email,
      name: name || undefined,
      isValid: isValidEmail(email),
    };
  }

  // Just an email address
  return {
    email: trimmed,
    isValid: isValidEmail(trimmed),
  };
}
