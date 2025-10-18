/**
 * Extract email address from various formats
 * Handles both string format and object format { name: string, email: string }
 *
 * @param address - Email address in various formats
 * @returns Email address string or null
 */
export function extractEmailAddress(
  address: string | { name?: string; email: string } | null | undefined
): string | null {
  if (!address) return null;

  if (typeof address === 'string') {
    return address.toLowerCase().trim();
  }

  if (typeof address === 'object' && 'email' in address) {
    return address.email.toLowerCase().trim();
  }

  return null;
}

/**
 * Extract multiple email addresses from an array
 *
 * @param addresses - Array of email addresses in various formats
 * @returns Array of email address strings
 */
export function extractEmailAddresses(
  addresses: (string | { name?: string; email: string })[] | null | undefined
): string[] {
  if (!addresses || !Array.isArray(addresses)) return [];

  return addresses
    .map(extractEmailAddress)
    .filter((email): email is string => email !== null);
}
