'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { searchEmailsFromSender } from './search';

export interface RelationshipInsights {
  contactEmail: string;
  contactName?: string;
  totalEmails: number;
  emailsSent: number;
  emailsReceived: number;
  firstContact: Date;
  lastContact: Date;
  avgResponseTime: number; // in hours
  responseRate: number; // percentage
  commonTopics: string[];
  communicationFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  relationshipStrength: 'strong' | 'moderate' | 'weak';
}

/**
 * Analyze relationship with a contact based on email history
 */
export async function analyzeRelationship(
  contactEmail: string,
  userId: string
): Promise<{
  success: boolean;
  insights?: RelationshipInsights;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Query emails with this contact
    const contactEmails = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        bodyText: emails.bodyText,
        fromAddress: emails.fromAddress,
        toAddress: emails.toAddress,
        receivedAt: emails.receivedAt,
        sentAt: emails.sentAt,
        isRead: emails.isRead,
      })
      .from(emails)
      .where(
        and(
          eq(emails.userId, userId),
          or(
            sql`${emails.fromAddress}->>'email' = ${contactEmail}`,
            sql`${emails.toAddress}::text ILIKE '%${contactEmail}%'`
          )
        )
      )
      .orderBy(emails.receivedAt);

    if (contactEmails.length === 0) {
      return { success: false, error: 'No emails found with this contact' };
    }

    // Calculate metrics
    const sent = contactEmails.filter((e) =>
      (e.toAddress as any)?.toString().includes(contactEmail)
    );
    const received = contactEmails.filter(
      (e) => (e.fromAddress as any)?.email === contactEmail
    );

    const firstContact = contactEmails[0].receivedAt || new Date();
    const lastContact =
      contactEmails[contactEmails.length - 1].receivedAt || new Date();

    // Calculate response rate and time
    const { responseRate, avgResponseTime } = calculateResponseMetrics(
      sent,
      received
    );

    // Determine communication frequency
    const daysSinceFirst =
      (lastContact.getTime() - firstContact.getTime()) / (1000 * 60 * 60 * 24);
    const emailsPerDay = contactEmails.length / Math.max(daysSinceFirst, 1);
    const frequency = determineFrequency(emailsPerDay);

    // Determine relationship strength
    const strength = determineRelationshipStrength(
      contactEmails.length,
      responseRate,
      emailsPerDay
    );

    // Extract common topics (simple keyword extraction)
    const commonTopics = extractCommonTopics(contactEmails);

    // Get contact name from first received email
    const contactName =
      received[0]?.fromAddress &&
      typeof received[0].fromAddress === 'object' &&
      'name' in received[0].fromAddress
        ? (received[0].fromAddress as any).name
        : undefined;

    const insights: RelationshipInsights = {
      contactEmail,
      contactName,
      totalEmails: contactEmails.length,
      emailsSent: sent.length,
      emailsReceived: received.length,
      firstContact,
      lastContact,
      avgResponseTime,
      responseRate,
      commonTopics,
      communicationFrequency: frequency,
      relationshipStrength: strength,
    };

    return { success: true, insights };
  } catch (error) {
    console.error('Error analyzing relationship:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate response metrics
 */
function calculateResponseMetrics(
  sent: any[],
  received: any[]
): { responseRate: number; avgResponseTime: number } {
  if (received.length === 0) {
    return { responseRate: 0, avgResponseTime: 0 };
  }

  let totalResponseTime = 0;
  let responseCount = 0;

  // Simple heuristic: find sent emails within 48 hours after received
  received.forEach((receivedEmail) => {
    const receivedTime = receivedEmail.receivedAt.getTime();
    const responses = sent.filter((sentEmail) => {
      const sentTime = sentEmail.sentAt?.getTime() || sentEmail.receivedAt.getTime();
      const diff = sentTime - receivedTime;
      return diff > 0 && diff < 48 * 60 * 60 * 1000; // Within 48 hours
    });

    if (responses.length > 0) {
      const firstResponse = responses[0];
      const responseTime =
        (firstResponse.sentAt?.getTime() || firstResponse.receivedAt.getTime()) -
        receivedTime;
      totalResponseTime += responseTime;
      responseCount++;
    }
  });

  const responseRate = (responseCount / received.length) * 100;
  const avgResponseTime =
    responseCount > 0 ? totalResponseTime / responseCount / (1000 * 60 * 60) : 0; // Convert to hours

  return { responseRate, avgResponseTime };
}

/**
 * Determine communication frequency
 */
function determineFrequency(
  emailsPerDay: number
): 'daily' | 'weekly' | 'monthly' | 'occasional' {
  if (emailsPerDay >= 0.5) return 'daily';
  if (emailsPerDay >= 0.14) return 'weekly'; // ~1 per week
  if (emailsPerDay >= 0.03) return 'monthly'; // ~1 per month
  return 'occasional';
}

/**
 * Determine relationship strength
 */
function determineRelationshipStrength(
  totalEmails: number,
  responseRate: number,
  emailsPerDay: number
): 'strong' | 'moderate' | 'weak' {
  const score = totalEmails * 0.3 + responseRate * 0.5 + emailsPerDay * 100 * 0.2;

  if (score >= 50) return 'strong';
  if (score >= 20) return 'moderate';
  return 'weak';
}

/**
 * Extract common topics from email subjects
 */
function extractCommonTopics(emails: any[]): string[] {
  const wordFreq = new Map<string, number>();
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    're',
    'fwd',
    'fw',
  ]);

  emails.forEach((email) => {
    const subject = (email.subject || '').toLowerCase();
    const words = subject.match(/\b[a-z]{3,}\b/g) || [];

    words.forEach((word) => {
      if (!stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

