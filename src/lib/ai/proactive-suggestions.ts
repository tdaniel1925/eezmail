/**
 * Proactive AI Suggestions Engine
 * Analyzes user's email patterns and generates proactive suggestions
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, contacts } from '@/db/schema';
import { sql, and, eq, lt, gte, desc } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ProactiveSuggestion {
  id: string;
  type:
    | 'unreplied'
    | 'meeting'
    | 'follow_up'
    | 'vip_waiting'
    | 'deadline'
    | 'attachment_request';
  priority: 'high' | 'medium' | 'low';
  message: string;
  action: string;
  emailId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Generate proactive suggestions for a user
 * This runs as a background job (cron) every hour
 */
export async function generateProactiveSuggestions(
  userId: string
): Promise<ProactiveSuggestion[]> {
  const suggestions: ProactiveSuggestion[] = [];

  try {
    // 1. Check for unreplied emails from VIPs
    const unreplied = await getUnrepliedEmailsFromVIPs(userId);
    if (unreplied.length > 0) {
      unreplied.forEach((email) => {
        suggestions.push({
          id: `unreplied-${email.id}`,
          type: 'unreplied',
          priority: 'high',
          message: `You haven't replied to ${email.senderName || email.senderEmail} from ${formatDate(email.receivedAt)}`,
          action: 'reply',
          emailId: email.id,
          metadata: { sender: email.senderEmail },
          createdAt: new Date(),
        });
      });
    }

    // 2. Detect meetings without calendar events
    const meetingEmails = await detectMeetingEmails(userId);
    meetingEmails.forEach((email) => {
      suggestions.push({
        id: `meeting-${email.id}`,
        type: 'meeting',
        priority: 'medium',
        message: `"${email.subject}" mentions a meeting but no calendar event found`,
        action: 'create_event',
        emailId: email.id,
        metadata: { subject: email.subject },
        createdAt: new Date(),
      });
    });

    // 3. Check for emails requiring follow-up
    const followUpEmails = await getEmailsNeedingFollowUp(userId);
    followUpEmails.forEach((email) => {
      suggestions.push({
        id: `followup-${email.id}`,
        type: 'follow_up',
        priority: 'medium',
        message: `Follow up on "${email.subject}" from ${formatDate(email.receivedAt)}`,
        action: 'follow_up',
        emailId: email.id,
        createdAt: new Date(),
      });
    });

    // 4. Detect VIPs waiting for response (> 24 hours)
    const vipWaiting = await getVIPsWaitingForResponse(userId);
    vipWaiting.forEach((email) => {
      suggestions.push({
        id: `vip-${email.id}`,
        type: 'vip_waiting',
        priority: 'high',
        message: `VIP ${email.senderName || email.senderEmail} is waiting for your response (${getDaysAgo(email.receivedAt)} days)`,
        action: 'reply',
        emailId: email.id,
        metadata: { daysWaiting: getDaysAgo(email.receivedAt) },
        createdAt: new Date(),
      });
    });

    // 5. Detect deadline-related emails
    const deadlineEmails = await detectDeadlineEmails(userId);
    deadlineEmails.forEach((email) => {
      suggestions.push({
        id: `deadline-${email.id}`,
        type: 'deadline',
        priority: 'high',
        message: `Email "${email.subject}" mentions a deadline`,
        action: 'review',
        emailId: email.id,
        createdAt: new Date(),
      });
    });

    console.log(
      `✨ Generated ${suggestions.length} proactive suggestions for user ${userId}`
    );

    // Sort by priority (high first)
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  } catch (error) {
    console.error('Error generating proactive suggestions:', error);
    return [];
  }
}

/**
 * Get unreplied emails from VIP contacts (last 7 days)
 */
async function getUnrepliedEmailsFromVIPs(userId: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const results = await db.execute(sql`
    SELECT DISTINCT ON (e.sender_email)
      e.id,
      e.subject,
      e.sender_email as "senderEmail",
      e.sender_name as "senderName",
      e.received_at as "receivedAt"
    FROM emails e
    INNER JOIN contacts c ON c.email = e.sender_email AND c.user_id = ${userId}
    WHERE e.account_id IN (SELECT id FROM email_accounts WHERE user_id = ${userId})
      AND e.is_read = true
      AND e.is_trashed = false
      AND e.received_at >= ${sevenDaysAgo.toISOString()}
      AND c.is_vip = true
      AND NOT EXISTS (
        SELECT 1 FROM emails replies
        WHERE replies.in_reply_to = e.message_id
          AND replies.account_id IN (SELECT id FROM email_accounts WHERE user_id = ${userId})
      )
    ORDER BY e.sender_email, e.received_at DESC
    LIMIT 5
  `);

  return results.rows.map((row: any) => ({
    id: row.id,
    subject: row.subject || '(No subject)',
    senderEmail: row.senderEmail,
    senderName: row.senderName,
    receivedAt: new Date(row.receivedAt),
  }));
}

/**
 * Detect emails that mention meetings (using AI)
 */
async function detectMeetingEmails(userId: string): Promise<
  Array<{
    id: string;
    subject: string;
    bodyText: string;
    receivedAt: Date;
  }>
> {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Get recent emails
  const results = await db.execute(sql`
    SELECT id, subject, body_text, received_at
    FROM emails
    WHERE account_id IN (SELECT id FROM email_accounts WHERE user_id = ${userId})
      AND is_trashed = false
      AND received_at >= ${threeDaysAgo.toISOString()}
      AND (
        LOWER(subject) LIKE '%meeting%'
        OR LOWER(subject) LIKE '%call%'
        OR LOWER(subject) LIKE '%schedule%'
        OR LOWER(body_text) LIKE '%meeting%'
        OR LOWER(body_text) LIKE '%call%'
      )
    LIMIT 10
  `);

  // TODO: In production, use AI to parse meeting details more accurately
  // For now, return emails with meeting keywords
  return results.rows.slice(0, 3).map((row: any) => ({
    id: row.id,
    subject: row.subject || '(No subject)',
    bodyText: row.body_text || '',
    receivedAt: new Date(row.received_at),
  }));
}

/**
 * Get emails marked for follow-up
 */
async function getEmailsNeedingFollowUp(userId: string) {
  const results = await db.execute(sql`
    SELECT id, subject, received_at
    FROM emails
    WHERE account_id IN (SELECT id FROM email_accounts WHERE user_id = ${userId})
      AND needs_reply = true
      AND is_trashed = false
      AND is_read = true
    ORDER BY received_at DESC
    LIMIT 5
  `);

  return results.rows.map((row: any) => ({
    id: row.id,
    subject: row.subject || '(No subject)',
    receivedAt: new Date(row.received_at),
  }));
}

/**
 * Get VIPs waiting for response (> 24 hours)
 */
async function getVIPsWaitingForResponse(userId: string) {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const results = await db.execute(sql`
    SELECT DISTINCT ON (e.sender_email)
      e.id,
      e.subject,
      e.sender_email as "senderEmail",
      e.sender_name as "senderName",
      e.received_at as "receivedAt"
    FROM emails e
    INNER JOIN contacts c ON c.email = e.sender_email AND c.user_id = ${userId}
    WHERE e.account_id IN (SELECT id FROM email_accounts WHERE user_id = ${userId})
      AND e.is_read = true
      AND e.is_trashed = false
      AND e.received_at <= ${oneDayAgo.toISOString()}
      AND c.is_vip = true
      AND NOT EXISTS (
        SELECT 1 FROM emails replies
        WHERE replies.in_reply_to = e.message_id
          AND replies.account_id IN (SELECT id FROM email_accounts WHERE user_id = ${userId})
      )
    ORDER BY e.sender_email, e.received_at ASC
    LIMIT 5
  `);

  return results.rows.map((row: any) => ({
    id: row.id,
    subject: row.subject || '(No subject)',
    senderEmail: row.senderEmail,
    senderName: row.senderName,
    receivedAt: new Date(row.receivedAt),
  }));
}

/**
 * Detect emails mentioning deadlines
 */
async function detectDeadlineEmails(userId: string) {
  const results = await db.execute(sql`
    SELECT id, subject, body_text, received_at
    FROM emails
    WHERE account_id IN (SELECT id FROM email_accounts WHERE user_id = ${userId})
      AND is_trashed = false
      AND is_read = false
      AND (
        LOWER(subject) LIKE '%deadline%'
        OR LOWER(subject) LIKE '%due date%'
        OR LOWER(subject) LIKE '%urgent%'
        OR LOWER(body_text) LIKE '%deadline%'
        OR LOWER(body_text) LIKE '%due by%'
      )
    ORDER BY received_at DESC
    LIMIT 5
  `);

  return results.rows.slice(0, 3).map((row: any) => ({
    id: row.id,
    subject: row.subject || '(No subject)',
    bodyText: row.body_text || '',
    receivedAt: new Date(row.received_at),
  }));
}

/**
 * Helper: Format date as relative time
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

/**
 * Helper: Get days ago
 */
function getDaysAgo(date: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
