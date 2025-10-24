// src/lib/sync/duplicate-detector.ts
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy string matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two strings
 * Returns value between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);

  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Normalize email subject for comparison
 * Removes Re:, Fwd:, [tags], extra whitespace
 */
function normalizeSubject(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/^(re|fwd|fw):\s*/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize email address for comparison
 */
function normalizeEmail(email: string | undefined | null): string {
  if (!email) {
    return '';
  }
  return email.toLowerCase().trim();
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateId?: string;
  confidence: number; // 0-1, how confident we are it's a duplicate
  reason?: string;
}

export interface EmailToCheck {
  messageId: string;
  subject: string;
  fromAddress: { email: string; name: string };
  receivedAt: Date;
  bodyPreview?: string;
  accountId: string;
}

/**
 * Check if an email is a duplicate of an existing email
 * Uses multiple heuristics with confidence scoring
 */
export async function checkForDuplicate(
  email: EmailToCheck
): Promise<DuplicateCheckResult> {
  try {
    // 1. Exact messageId match (100% confidence)
    const exactMatch = await db.query.emails.findFirst({
      where: (emails, { and, eq }) =>
        and(
          eq(emails.accountId, email.accountId),
          eq(emails.messageId, email.messageId)
        ),
    });

    if (exactMatch) {
      return {
        isDuplicate: true,
        duplicateId: exactMatch.id,
        confidence: 1.0,
        reason: 'Exact messageId match',
      };
    }

    // 2. Fuzzy matching for potential duplicates
    // Look for emails from same sender within 5 minutes
    const timeWindow = new Date(email.receivedAt);
    timeWindow.setMinutes(timeWindow.getMinutes() - 5);

    const potentialDuplicates = await db.query.emails.findMany({
      where: (emails, { and, eq, gte }) =>
        and(
          eq(emails.accountId, email.accountId),
          gte(emails.receivedAt, timeWindow)
        ),
      limit: 50, // Check last 50 emails in time window
    });

    const normalizedSubject = normalizeSubject(email.subject);
    const normalizedFromEmail = normalizeEmail(email.fromAddress.email);

    for (const candidate of potentialDuplicates) {
      let confidence = 0;
      const reasons: string[] = [];

      // Check sender email (exact match required for fuzzy check)
      if (normalizeEmail(candidate.fromAddress.email) !== normalizedFromEmail) {
        continue; // Different sender, skip
      }

      // Subject similarity (weight: 40%)
      const candidateSubject = normalizeSubject(candidate.subject);
      const subjectSimilarity = calculateSimilarity(
        normalizedSubject,
        candidateSubject
      );
      confidence += subjectSimilarity * 0.4;

      if (subjectSimilarity >= 0.9) {
        reasons.push('Very similar subject');
      }

      // Received time proximity (weight: 30%)
      const timeDiff = Math.abs(
        email.receivedAt.getTime() - candidate.receivedAt.getTime()
      );
      const maxTimeDiff = 5 * 60 * 1000; // 5 minutes
      const timeProximity = Math.max(0, 1 - timeDiff / maxTimeDiff);
      confidence += timeProximity * 0.3;

      if (timeDiff < 60000) {
        // Within 1 minute
        reasons.push('Received within 1 minute');
      }

      // Body preview similarity (weight: 30%)
      if (email.bodyPreview && candidate.snippet) {
        const bodySimilarity = calculateSimilarity(
          email.bodyPreview.substring(0, 200),
          candidate.snippet.substring(0, 200)
        );
        confidence += bodySimilarity * 0.3;

        if (bodySimilarity >= 0.9) {
          reasons.push('Very similar content');
        }
      } else {
        // No body to compare, use subject more heavily
        confidence += subjectSimilarity * 0.3;
      }

      // If confidence is high enough, mark as duplicate
      if (confidence >= 0.85) {
        return {
          isDuplicate: true,
          duplicateId: candidate.id,
          confidence,
          reason: reasons.join(', '),
        };
      }
    }

    // No duplicate found
    return {
      isDuplicate: false,
      confidence: 0,
    };
  } catch (error) {
    console.error('Error checking for duplicate:', error);
    // On error, assume not duplicate to avoid data loss
    return {
      isDuplicate: false,
      confidence: 0,
    };
  }
}

/**
 * Batch check multiple emails for duplicates
 * More efficient than checking one at a time
 */
export async function batchCheckForDuplicates(
  emails: EmailToCheck[]
): Promise<Map<string, DuplicateCheckResult>> {
  const results = new Map<string, DuplicateCheckResult>();

  for (const email of emails) {
    const result = await checkForDuplicate(email);
    results.set(email.messageId, result);
  }

  return results;
}

/**
 * Mark an email as duplicate in the database
 * Sets a flag and links to the original email
 */
export async function markAsDuplicate(
  emailId: string,
  originalEmailId: string
): Promise<void> {
  await db
    .update(emails)
    .set({
      // Add metadata to indicate it's a duplicate
      // You may want to add a 'duplicateOf' field to the schema
      updatedAt: new Date(),
    } as any)
    .where(eq(emails.id, emailId));
}
