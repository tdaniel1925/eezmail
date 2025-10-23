'use server';

import { db } from '@/lib/db';
import { emails, contacts, emailAccounts, calendarEvents } from '@/db/schema';
import { eq, desc, and, gte, lte, isNull, sql } from 'drizzle-orm';
import { getWritingStyleProfile } from './user-profile';

/**
 * Proactive Intelligence Service
 * Analyzes user patterns and generates smart suggestions
 */

export interface ProactiveSuggestion {
  id: string;
  type:
    | 'reply_reminder'
    | 'meeting_prep'
    | 'follow_up'
    | 'priority_email'
    | 'pattern_insight'
    | 'time_suggestion';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionable: boolean;
  action?: {
    type: string;
    parameters: Record<string, any>;
  };
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Generate proactive suggestions for a user
 */
export async function generateProactiveSuggestions(
  userId: string
): Promise<ProactiveSuggestion[]> {
  console.log(`🔮 [Proactive] Generating suggestions for user: ${userId}`);

  const suggestions: ProactiveSuggestion[] = [];

  try {
    // Get user's profile for pattern analysis
    const profile = await getWritingStyleProfile(userId);

    // 1. Reply reminders (emails needing response)
    const replyReminders = await checkForPendingReplies(userId, profile);
    suggestions.push(...replyReminders);

    // 2. Meeting prep suggestions
    const meetingPrep = await checkUpcomingMeetings(userId);
    suggestions.push(...meetingPrep);

    // 3. Follow-up reminders
    const followUps = await checkFollowUpNeeded(userId);
    suggestions.push(...followUps);

    // 4. Priority emails from important contacts
    const priorityEmails = await checkPriorityEmails(userId, profile);
    suggestions.push(...priorityEmails);

    // 5. Pattern insights
    const patterns = await analyzeUserPatterns(userId, profile);
    suggestions.push(...patterns);

    // Sort by priority
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    console.log(`✨ [Proactive] Generated ${suggestions.length} suggestions`);
    return suggestions.slice(0, 10); // Return top 10
  } catch (error) {
    console.error(`❌ [Proactive] Error generating suggestions:`, error);
    return [];
  }
}

/**
 * Check for emails needing replies
 */
async function checkForPendingReplies(
  userId: string,
  profile: any
): Promise<ProactiveSuggestion[]> {
  const suggestions: ProactiveSuggestion[] = [];

  // Get user's email account IDs
  const accounts = await db.query.emailAccounts.findMany({
    where: eq(emailAccounts.userId, userId),
    columns: { id: true },
  });

  if (accounts.length === 0) return suggestions;

  // Get recent unread emails from frequent contacts
  const recentUnread = await db.query.emails.findMany({
    where: and(
      eq(emails.accountId, accounts[0].id),
      eq(emails.isRead, false),
      eq(emails.folder, 'inbox'),
      gte(emails.receivedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
    ),
    orderBy: [desc(emails.receivedAt)],
    limit: 50,
  });

  // Check if sender is a frequent contact
  const frequentContacts = profile?.frequentContacts || [];
  const avgResponseTime = profile?.responseTimeAvg || 60; // minutes

  for (const email of recentUnread) {
    const isFrequentContact = frequentContacts.includes(email.fromAddress);
    const hoursSinceReceived =
      (Date.now() - new Date(email.receivedAt).getTime()) / (1000 * 60 * 60);

    // If from frequent contact and past usual response time
    if (isFrequentContact && hoursSinceReceived * 60 > avgResponseTime * 2) {
      suggestions.push({
        id: `reply-${email.id}`,
        type: 'reply_reminder',
        priority: 'high',
        title: `Reply to ${email.fromName || email.fromAddress}`,
        message: `You usually reply within ${avgResponseTime} minutes, but this email has been waiting ${Math.round(hoursSinceReceived)} hours.`,
        actionable: true,
        action: {
          type: 'compose_reply',
          parameters: { emailId: email.id },
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    }
  }

  return suggestions.slice(0, 3); // Top 3 reply reminders
}

/**
 * Check for upcoming meetings needing preparation
 */
async function checkUpcomingMeetings(
  userId: string
): Promise<ProactiveSuggestion[]> {
  const suggestions: ProactiveSuggestion[] = [];

  // Get meetings in the next 2 hours
  const upcoming = await db.query.calendarEvents.findMany({
    where: and(
      eq(calendarEvents.userId, userId),
      gte(calendarEvents.startTime, new Date()),
      lte(
        calendarEvents.startTime,
        new Date(Date.now() + 2 * 60 * 60 * 1000) // Next 2 hours
      )
    ),
    orderBy: [calendarEvents.startTime],
    limit: 5,
  });

  for (const meeting of upcoming) {
    const minutesUntil =
      (new Date(meeting.startTime).getTime() - Date.now()) / (1000 * 60);

    suggestions.push({
      id: `meeting-prep-${meeting.id}`,
      type: 'meeting_prep',
      priority: minutesUntil < 30 ? 'high' : 'medium',
      title: `Meeting in ${Math.round(minutesUntil)} minutes`,
      message: `"${meeting.title}" starts soon. Want to see related emails?`,
      actionable: true,
      action: {
        type: 'search_meeting_context',
        parameters: { eventId: meeting.id, title: meeting.title },
      },
      createdAt: new Date(),
      expiresAt: new Date(meeting.startTime),
    });
  }

  return suggestions;
}

/**
 * Check for emails needing follow-up
 */
async function checkFollowUpNeeded(
  userId: string
): Promise<ProactiveSuggestion[]> {
  const suggestions: ProactiveSuggestion[] = [];

  // Get user's sent emails from last 14 days
  const accounts = await db.query.emailAccounts.findMany({
    where: eq(emailAccounts.userId, userId),
    columns: { id: true },
  });

  if (accounts.length === 0) return suggestions;

  const sentEmails = await db.query.emails.findMany({
    where: and(
      eq(emails.accountId, accounts[0].id),
      eq(emails.folder, 'sent'),
      gte(emails.receivedAt, new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)) // Last 14 days
    ),
    orderBy: [desc(emails.receivedAt)],
    limit: 20,
  });

  // Check for sent emails with no reply after 5 days
  for (const sentEmail of sentEmails) {
    const daysSinceSent =
      (Date.now() - new Date(sentEmail.receivedAt).getTime()) /
      (1000 * 60 * 60 * 24);

    if (daysSinceSent >= 5 && daysSinceSent <= 10) {
      // Check if there's been a reply (simplified - would need thread checking)
      suggestions.push({
        id: `follow-up-${sentEmail.id}`,
        type: 'follow_up',
        priority: 'medium',
        title: `Follow up with ${sentEmail.toAddress}`,
        message: `No response to "${sentEmail.subject}" sent ${Math.round(daysSinceSent)} days ago.`,
        actionable: true,
        action: {
          type: 'compose_follow_up',
          parameters: { originalEmailId: sentEmail.id },
        },
        createdAt: new Date(),
      });
    }
  }

  return suggestions.slice(0, 2); // Top 2 follow-ups
}

/**
 * Check for priority emails
 */
async function checkPriorityEmails(
  userId: string,
  profile: any
): Promise<ProactiveSuggestion[]> {
  const suggestions: ProactiveSuggestion[] = [];

  const accounts = await db.query.emailAccounts.findMany({
    where: eq(emailAccounts.userId, userId),
    columns: { id: true },
  });

  if (accounts.length === 0) return suggestions;

  const frequentContacts = profile?.frequentContacts || [];

  // Get unread emails from top contacts
  const priorityUnread = await db.query.emails.findMany({
    where: and(
      eq(emails.accountId, accounts[0].id),
      eq(emails.isRead, false),
      eq(emails.folder, 'inbox')
    ),
    orderBy: [desc(emails.receivedAt)],
    limit: 100,
  });

  let count = 0;
  for (const email of priorityUnread) {
    if (frequentContacts.includes(email.fromAddress)) {
      count++;
    }
  }

  if (count > 0) {
    suggestions.push({
      id: `priority-emails`,
      type: 'priority_email',
      priority: count >= 3 ? 'high' : 'medium',
      title: `${count} unread from important contacts`,
      message: `You have ${count} unread email(s) from your frequent contacts.`,
      actionable: true,
      action: {
        type: 'show_priority_emails',
        parameters: { contacts: frequentContacts },
      },
      createdAt: new Date(),
    });
  }

  return suggestions;
}

/**
 * Analyze user patterns and provide insights
 */
async function analyzeUserPatterns(
  userId: string,
  profile: any
): Promise<ProactiveSuggestion[]> {
  const suggestions: ProactiveSuggestion[] = [];

  if (!profile) return suggestions;

  // Analyze active hours
  const activeHours = profile.activeHours;
  const currentHour = new Date().getHours();

  if (activeHours?.start && activeHours?.end) {
    // If outside active hours
    if (currentHour < activeHours.start || currentHour > activeHours.end) {
      suggestions.push({
        id: `time-insight`,
        type: 'time_suggestion',
        priority: 'low',
        title: 'Outside your usual work hours',
        message: `You typically work between ${activeHours.start}:00 and ${activeHours.end}:00. Take a break! 😊`,
        actionable: false,
        createdAt: new Date(),
      });
    }
  }

  // Pattern: If user analyzed emails show a trend
  if (profile.totalEmailsAnalyzed >= 20) {
    suggestions.push({
      id: `pattern-insight`,
      type: 'pattern_insight',
      priority: 'low',
      title: 'Your email patterns',
      message: `You typically write ${profile.avgEmailLength}-word emails in a ${profile.preferredTone} tone. Your most common topics: ${profile.commonTopics.slice(0, 3).join(', ')}.`,
      actionable: false,
      createdAt: new Date(),
    });
  }

  return suggestions;
}

/**
 * Get actionable suggestions only
 */
export async function getActionableSuggestions(
  userId: string
): Promise<ProactiveSuggestion[]> {
  const all = await generateProactiveSuggestions(userId);
  return all.filter((s) => s.actionable);
}

/**
 * Get suggestions by type
 */
export async function getSuggestionsByType(
  userId: string,
  type: ProactiveSuggestion['type']
): Promise<ProactiveSuggestion[]> {
  const all = await generateProactiveSuggestions(userId);
  return all.filter((s) => s.type === type);
}
