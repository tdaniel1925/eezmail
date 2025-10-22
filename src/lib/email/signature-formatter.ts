import { createClient } from '@/lib/supabase/server';

export interface SignatureData {
  name: string;
  email: string;
  hasRealData: boolean; // true if from database, false if placeholder
}

/**
 * Extract name from HTML signature content
 * Looks for common patterns in signature HTML
 */
export function extractNameFromSignature(htmlContent: string): string | null {
  if (!htmlContent) return null;

  // Remove HTML tags and get plain text
  const plainText = htmlContent.replace(/<[^>]*>/g, '').trim();

  // Split by lines and look for name patterns
  const lines = plainText.split('\n').map((line) => line.trim());

  // First non-empty line is often the name
  const firstLine = lines.find((line) => line.length > 0);

  // Filter out common signature elements that aren't names
  const excludePatterns = [
    /^best regards/i,
    /^sincerely/i,
    /^thanks/i,
    /^regards/i,
    /^\d/,
    /@/,
    /^tel:/i,
    /^phone:/i,
    /^email:/i,
    /^mobile:/i,
  ];

  if (
    firstLine &&
    !excludePatterns.some((pattern) => pattern.test(firstLine))
  ) {
    return firstLine;
  }

  return null;
}

/**
 * Fetch user's signature data from database
 * Falls back to user profile data if no signature exists
 */
export async function getUserSignatureData(
  userId: string
): Promise<SignatureData> {
  const supabase = await createClient();

  // Try to get default signature first
  const { data: signature } = await supabase
    .from('email_signatures')
    .select('name, htmlContent, textContent')
    .eq('userId', userId)
    .eq('isDefault', true)
    .eq('isEnabled', true)
    .maybeSingle();

  // Try to extract name from signature content
  let name: string | null = null;
  if (signature) {
    name = extractNameFromSignature(
      signature.htmlContent || signature.textContent || ''
    );
  }

  // Fall back to user profile data
  if (!name) {
    const { data: user } = await supabase
      .from('users')
      .select('fullName, email')
      .eq('id', userId)
      .maybeSingle();

    if (user) {
      return {
        name: user.fullName || '[Your Name]',
        email: user.email || '[your.email@example.com]',
        hasRealData: !!user.fullName,
      };
    }
  }

  // Get user email for signature
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  if (name && user?.email) {
    return {
      name,
      email: user.email,
      hasRealData: true,
    };
  }

  // Ultimate fallback - placeholders
  return {
    name: '[Your Name]',
    email: '[your.email@example.com]',
    hasRealData: false,
  };
}

/**
 * Format professional signature block
 * Returns formatted string with proper spacing
 */
export function formatProfessionalSignature(
  name: string,
  email: string
): string {
  return `Best regards,\n\n${name}\n${email}`;
}

/**
 * Get formatted signature for AI email generation
 * Convenience function that combines fetch and format
 */
export async function getFormattedSignature(userId: string): Promise<string> {
  const signatureData = await getUserSignatureData(userId);
  return formatProfessionalSignature(signatureData.name, signatureData.email);
}
