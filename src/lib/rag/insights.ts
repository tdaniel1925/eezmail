'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface Insight {
  id: string;
  type: 'trend' | 'action_item' | 'pattern' | 'anomaly' | 'opportunity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedAction?: string;
  relatedEmails: string[]; // Email IDs
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Generate proactive insights from user's email data
 */
export async function generateInsights(
  userId: string,
  options: {
    daysBack?: number;
    limit?: number;
  } = {}
): Promise<{
  success: boolean;
  insights: Insight[];
  error?: string;
}> {
  const { daysBack = 30, limit = 10 } = options;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, insights: [], error: 'Unauthorized' };
    }

    const insights: Insight[] = [];
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    // Get recent emails
    const recentEmails = await db
      .select()
      .from(emails)
      .where(and(eq(emails.userId, userId), gte(emails.receivedAt, since)))
      .orderBy(emails.receivedAt);

    // 1. Detect unread important emails
    const unreadInsight = await detectUnreadImportantEmails(
      recentEmails,
      userId
    );
    if (unreadInsight) insights.push(unreadInsight);

    // 2. Detect unanswered emails from important contacts
    const unansweredInsight = await detectUnansweredEmails(
      recentEmails,
      userId
    );
    if (unansweredInsight) insights.push(unansweredInsight);

    // 3. Detect communication patterns
    const patternInsight = await detectCommunicationPatterns(
      recentEmails,
      userId
    );
    if (patternInsight) insights.push(patternInsight);

    // 4. Detect topics trending in emails
    const trendInsight = await detectTrendingTopics(recentEmails, userId);
    if (trendInsight) insights.push(trendInsight);

    // 5. Detect opportunities (long threads that need action)
    const opportunityInsight = await detectOpportunities(recentEmails, userId);
    if (opportunityInsight) insights.push(opportunityInsight);

    // Sort by priority and limit
    insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
      success: true,
      insights: insights.slice(0, limit),
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      success: false,
      insights: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function detectUnreadImportantEmails(
  emails: any[],
  userId: string
): Promise<Insight | null> {
  const unread = emails.filter((e) => !e.isRead);

  if (unread.length < 5) return null;

  return {
    id: `unread-${Date.now()}`,
    type: 'action_item',
    title: `${unread.length} Unread Emails`,
    description: `You have ${unread.length} unread emails from the last 30 days. Consider reviewing them.`,
    priority: unread.length > 20 ? 'high' : 'medium',
    actionable: true,
    suggestedAction: 'Review and archive or respond to unread emails',
    relatedEmails: unread.slice(0, 10).map((e) => e.id),
    createdAt: new Date(),
  };
}

async function detectUnansweredEmails(
  emails: any[],
  userId: string
): Promise<Insight | null> {
  // Simple heuristic: received emails without a sent reply in same thread
  const received = emails.filter(
    (e) => (e.fromAddress as any)?.email !== userId
  );

  // For simplicity, check for emails older than 3 days without reply
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const oldUnreplied = received.filter(
    (e) => e.receivedAt < threeDaysAgo && !e.threadId
  );

  if (oldUnreplied.length < 3) return null;

  return {
    id: `unanswered-${Date.now()}`,
    type: 'action_item',
    title: `${oldUnreplied.length} Emails May Need Response`,
    description: `You have ${oldUnreplied.length} emails from more than 3 days ago that may need a response.`,
    priority: 'high',
    actionable: true,
    suggestedAction: 'Review and respond to pending emails',
    relatedEmails: oldUnreplied.slice(0, 5).map((e) => e.id),
    createdAt: new Date(),
  };
}

async function detectCommunicationPatterns(
  emails: any[],
  userId: string
): Promise<Insight | null> {
  // Detect if user is most active at certain times
  const hourCounts = new Map<number, number>();

  emails.forEach((email) => {
    const hour = email.receivedAt.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  const mostActiveHour = Array.from(hourCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

  if (!mostActiveHour || mostActiveHour[1] < 10) return null;

  return {
    id: `pattern-${Date.now()}`,
    type: 'pattern',
    title: 'Communication Pattern Detected',
    description: `You receive most emails around ${mostActiveHour[0]}:00. Consider scheduling focus time after this period.`,
    priority: 'low',
    actionable: true,
    suggestedAction: 'Schedule focus time for email processing',
    relatedEmails: [],
    metadata: { mostActiveHour: mostActiveHour[0], count: mostActiveHour[1] },
    createdAt: new Date(),
  };
}

async function detectTrendingTopics(
  emails: any[],
  userId: string
): Promise<Insight | null> {
  const wordFreq = new Map<string, number>();
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 're', 'fwd']);

  emails.forEach((email) => {
    const subject = (email.subject || '').toLowerCase();
    const words = subject.match(/\b[a-z]{3,}\b/g) || [];

    words.forEach((word) => {
      if (!stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });
  });

  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (topWords.length === 0 || topWords[0][1] < 5) return null;

  return {
    id: `trend-${Date.now()}`,
    type: 'trend',
    title: 'Trending Topics',
    description: `Popular topics in your emails: ${topWords.map((w) => w[0]).join(', ')}`,
    priority: 'low',
    actionable: false,
    relatedEmails: [],
    metadata: { topics: topWords.map(([word, count]) => ({ word, count })) },
    createdAt: new Date(),
  };
}

async function detectOpportunities(
  emails: any[],
  userId: string
): Promise<Insight | null> {
  // Detect long threads (3+ emails) that are still active
  const threadCounts = new Map<string, number>();

  emails.forEach((email) => {
    if (email.threadId) {
      threadCounts.set(
        email.threadId,
        (threadCounts.get(email.threadId) || 0) + 1
      );
    }
  });

  const longThreads = Array.from(threadCounts.entries()).filter(
    ([, count]) => count >= 3
  );

  if (longThreads.length === 0) return null;

  return {
    id: `opportunity-${Date.now()}`,
    type: 'opportunity',
    title: `${longThreads.length} Active Conversations`,
    description: `You have ${longThreads.length} active email threads with 3+ messages. These may require follow-up.`,
    priority: 'medium',
    actionable: true,
    suggestedAction: 'Review active threads and take next steps',
    relatedEmails: [],
    metadata: { threadCount: longThreads.length },
    createdAt: new Date(),
  };
}

