/**
 * Unified Threading Service
 * Generates consistent thread IDs across all email providers (IMAP, Gmail, Microsoft)
 * Uses RFC 5322 headers (References, In-Reply-To) and subject-based fallback
 */

'use server';

import { createHash } from 'crypto';

export interface EmailThreadingData {
  messageId: string;
  subject: string;
  references?: string[];
  inReplyTo?: string;
  from?: { email: string; name: string };
  receivedAt: Date;
}

/**
 * Generate a consistent thread ID from email headers
 * Priority:
 * 1. Use References header (most reliable - contains full thread history)
 * 2. Use In-Reply-To header (direct parent reference)
 * 3. Fallback to subject-based grouping (normalized subject)
 */
export function generateThreadId(emailData: EmailThreadingData): string {
  // Priority 1: Use References header (extract root message ID)
  if (emailData.references && emailData.references.length > 0) {
    // First message in References is the original/root message
    const rootMessageId = emailData.references[0];
    return normalizeMessageId(rootMessageId);
  }

  // Priority 2: Use In-Reply-To header
  if (emailData.inReplyTo) {
    return normalizeMessageId(emailData.inReplyTo);
  }

  // Priority 3: Fallback to subject-based grouping
  // This handles cases where headers are missing (older emails, some IMAP servers)
  const normalizedSubject = normalizeSubject(emailData.subject);
  
  // Create a hash from normalized subject + sender for thread grouping
  // This ensures "Re: Meeting" from different senders don't group together
  const threadKey = `${normalizedSubject}:${emailData.from?.email || ''}`;
  return generateSubjectBasedThreadId(threadKey);
}

/**
 * Normalize Message-ID to consistent format
 * Removes angle brackets, trims whitespace
 */
function normalizeMessageId(messageId: string): string {
  return messageId
    .replace(/^<|>$/g, '') // Remove angle brackets
    .trim()
    .toLowerCase();
}

/**
 * Normalize email subject for thread grouping
 * Removes Re:, Fwd:, [tags], extra spaces
 */
export function normalizeSubject(subject: string): string {
  if (!subject) return '';

  return subject
    .toLowerCase()
    .trim()
    // Remove common reply/forward prefixes
    .replace(/^(re|fwd|fw|aw|sv|enc|r|tr|wg):\s*/gi, '')
    // Remove bracketed tags like [EXTERNAL], [Ticket #123]
    .replace(/\[[^\]]+\]/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a thread ID from subject + sender
 * Creates a consistent hash for emails in same conversation
 */
function generateSubjectBasedThreadId(threadKey: string): string {
  // Use SHA256 hash for consistent, collision-resistant IDs
  const hash = createHash('sha256').update(threadKey).digest('hex');
  // Use first 32 characters for reasonable length
  return `subject-${hash.substring(0, 32)}`;
}

/**
 * Parse References header from email
 * Format: "<msg1@domain> <msg2@domain> <msg3@domain>"
 */
export function parseReferencesHeader(referencesHeader: string | undefined): string[] {
  if (!referencesHeader) return [];

  // Split by spaces and angle brackets, filter out empty strings
  return referencesHeader
    .split(/[<>\s]+/)
    .filter((ref) => ref && ref.includes('@'))
    .map((ref) => ref.trim());
}

/**
 * Parse In-Reply-To header from email
 * Format: "<parent-msg-id@domain>"
 */
export function parseInReplyToHeader(inReplyToHeader: string | undefined): string | undefined {
  if (!inReplyToHeader) return undefined;

  const normalized = inReplyToHeader.replace(/^<|>$/g, '').trim();
  return normalized.includes('@') ? normalized : undefined;
}

/**
 * Check if two emails belong to the same thread
 * Useful for manual thread detection/linking
 */
export function areInSameThread(
  email1: EmailThreadingData,
  email2: EmailThreadingData
): boolean {
  const thread1 = generateThreadId(email1);
  const thread2 = generateThreadId(email2);

  // Direct thread ID match
  if (thread1 === thread2) return true;

  // Check if either email references the other
  if (email1.references?.includes(email2.messageId)) return true;
  if (email2.references?.includes(email1.messageId)) return true;

  // Check In-Reply-To relationship
  if (email1.inReplyTo === email2.messageId) return true;
  if (email2.inReplyTo === email1.messageId) return true;

  return false;
}

/**
 * Extract thread ID from Gmail threadId
 * Gmail provides native thread IDs, use them directly
 */
export function useGmailThreadId(gmailThreadId: string): string {
  return `gmail-${gmailThreadId}`;
}

/**
 * Extract thread ID from Microsoft conversationId
 * Microsoft provides conversation IDs, use them directly
 */
export function useMicrosoftConversationId(conversationId: string): string {
  return `microsoft-${conversationId}`;
}

/**
 * Validate if a thread ID is valid
 */
export function isValidThreadId(threadId: string | null | undefined): boolean {
  if (!threadId) return false;
  
  // Must be non-empty string
  if (typeof threadId !== 'string' || threadId.trim().length === 0) return false;
  
  // Should have reasonable length (not too short to be meaningful)
  if (threadId.length < 10) return false;
  
  return true;
}

/**
 * Get root message ID from References header
 * The first ID in References is typically the thread root
 */
export function getRootMessageId(references: string[] | undefined): string | undefined {
  if (!references || references.length === 0) return undefined;
  return references[0];
}

/**
 * Build References header for reply
 * Appends current message ID to existing References chain
 */
export function buildReferencesHeader(
  parentReferences: string[] | undefined,
  parentMessageId: string,
  currentMessageId: string
): string[] {
  const references = [...(parentReferences || [])];
  
  // Add parent message ID if not already present
  if (!references.includes(parentMessageId)) {
    references.push(parentMessageId);
  }
  
  // Add current message ID
  references.push(currentMessageId);
  
  return references;
}

