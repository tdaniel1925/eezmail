/**
 * Contact Intelligence System
 * Analyzes email patterns to provide insights about contacts
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, contacts } from '@/db/schema';
import { sql, eq, and, desc } from 'drizzle-orm';

export interface ContactIntelligence {
  email: string;
  name?: string;

  // Response patterns
  avgResponseTime: string; // "2 hours", "1 day", etc.
  avgResponseTimeMs: number;
  responseRate: number; // 0-1

  // Communication preferences
  preferredTimes: string[]; // ["9am-11am", "2pm-4pm"]
  preferredDays: string[]; // ["Monday", "Tuesday"]

  // Relationship metrics
  isVIP: boolean;
  interactionCount: number;
  lastInteraction: Date;
  relationshipStrength: number; // 0-1

  // Communication style
  avgEmailLength: number;
  emailFrequency: string; // "daily", "weekly", "monthly"
  topicsDiscussed: string[];

  // Predictions
  bestTimeToSend: string;
  likelyToRespond: boolean;
  confidence: number; // 0-1
}

/**
 * Analyze contact patterns and generate intelligence
 */
export async function analyzeContactPatterns(
  contactEmail: string,
  userId: string
): Promise<ContactIntelligence> {
  try {
    // Get all emails to/from this contact
    const results = await db.execute(sql`
      SELECT 
        id,
        subject,
        sender_email,
        received_at,
        body_text,
        in_reply_to,
        is_read
      FROM emails
      WHERE account_id IN (SELECT id FROM email_accounts WHERE user_id = ${userId})
        AND (sender_email = ${contactEmail} OR 
             to_addresses::text LIKE ${`%${contactEmail}%`})
        AND is_trashed = false
      ORDER BY received_at DESC
      LIMIT 100
    `);

    const emailsWithContact = results.rows;

    if (emailsWithContact.length === 0) {
      return getDefaultIntelligence(contactEmail);
    }

    // Separate sent and received
    const received = emailsWithContact.filter(
      (e: any) => e.sender_email === contactEmail
    );
    const sent = emailsWithContact.filter(
      (e: any) => e.sender_email !== contactEmail
    );

    // Calculate response times
    const responseTimes: number[] = [];
    for (const sentEmail of sent) {
      const reply = received.find((r: any) => r.in_reply_to === sentEmail.id);
      if (reply) {
        const responseTime =
          new Date(reply.received_at).getTime() -
          new Date(sentEmail.received_at).getTime();
        if (responseTime > 0) {
          responseTimes.push(responseTime);
        }
      }
    }

    const avgResponseTimeMs =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const avgResponseTime = formatDuration(avgResponseTimeMs);

    // Response rate
    const responseRate =
      sent.length > 0 ? responseTimes.length / sent.length : 0;

    // Preferred times (analyze received email timestamps)
    const preferredTimes = analyzePreferredTimes(
      received.map((e: any) => new Date(e.received_at))
    );
    const preferredDays = analyzePreferredDays(
      received.map((e: any) => new Date(e.received_at))
    );

    // Check if VIP from contacts table
    const [contactRecord] = await db
      .select({ isVIP: contacts.isVip })
      .from(contacts)
      .where(and(eq(contacts.email, contactEmail), eq(contacts.userId, userId)))
      .limit(1);

    const isVIP = contactRecord?.isVIP || false;

    // Interaction metrics
    const interactionCount = emailsWithContact.length;
    const lastInteraction = new Date(emailsWithContact[0].received_at);

    // Relationship strength (based on frequency and recency)
    const daysSinceLastInteraction =
      (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    const relationshipStrength = calculateRelationshipStrength(
      interactionCount,
      daysSinceLastInteraction
    );

    // Average email length
    const avgEmailLength =
      received.reduce(
        (sum: number, e: any) => sum + (e.body_text?.length || 0),
        0
      ) / (received.length || 1);

    // Email frequency
    const emailFrequency = calculateEmailFrequency(
      emailsWithContact.length,
      emailsWithContact
    );

    // Best time to send (based on when they typically respond)
    const bestTimeToSend = preferredTimes[0] || 'Morning (9am-12pm)';

    // Likely to respond (based on response rate and recency)
    const likelyToRespond = responseRate > 0.5 && daysSinceLastInteraction < 30;

    console.log(`📊 Analyzed contact intelligence for ${contactEmail}`);

    return {
      email: contactEmail,
      name: received[0]?.sender_name || undefined,
      avgResponseTime,
      avgResponseTimeMs,
      responseRate,
      preferredTimes,
      preferredDays,
      isVIP,
      interactionCount,
      lastInteraction,
      relationshipStrength,
      avgEmailLength: Math.round(avgEmailLength),
      emailFrequency,
      topicsDiscussed: [], // TODO: Extract with NLP
      bestTimeToSend,
      likelyToRespond,
      confidence: responseTimes.length >= 3 ? 0.8 : 0.5, // Higher confidence with more data
    };
  } catch (error) {
    console.error('Error analyzing contact patterns:', error);
    return getDefaultIntelligence(contactEmail);
  }
}

/**
 * Get default intelligence when no data available
 */
function getDefaultIntelligence(email: string): ContactIntelligence {
  return {
    email,
    avgResponseTime: 'Unknown',
    avgResponseTimeMs: 0,
    responseRate: 0,
    preferredTimes: [],
    preferredDays: [],
    isVIP: false,
    interactionCount: 0,
    lastInteraction: new Date(),
    relationshipStrength: 0,
    avgEmailLength: 0,
    emailFrequency: 'Unknown',
    topicsDiscussed: [],
    bestTimeToSend: 'Morning (9am-12pm)',
    likelyToRespond: false,
    confidence: 0,
  };
}

/**
 * Analyze preferred communication times
 */
function analyzePreferredTimes(dates: Date[]): string[] {
  const timeSlots = {
    'Early Morning (6am-9am)': 0,
    'Morning (9am-12pm)': 0,
    'Afternoon (12pm-3pm)': 0,
    'Late Afternoon (3pm-6pm)': 0,
    'Evening (6pm-9pm)': 0,
    'Night (9pm-12am)': 0,
  };

  dates.forEach((date) => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 9) timeSlots['Early Morning (6am-9am)']++;
    else if (hour >= 9 && hour < 12) timeSlots['Morning (9am-12pm)']++;
    else if (hour >= 12 && hour < 15) timeSlots['Afternoon (12pm-3pm)']++;
    else if (hour >= 15 && hour < 18) timeSlots['Late Afternoon (3pm-6pm)']++;
    else if (hour >= 18 && hour < 21) timeSlots['Evening (6pm-9pm)']++;
    else if (hour >= 21 || hour < 6) timeSlots['Night (9pm-12am)']++;
  });

  // Return top 2 time slots
  return Object.entries(timeSlots)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .filter(([_, count]) => count > 0)
    .map(([slot]) => slot);
}

/**
 * Analyze preferred communication days
 */
function analyzePreferredDays(dates: Date[]): string[] {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const dayCounts: Record<string, number> = {};

  dates.forEach((date) => {
    const day = days[date.getDay()];
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  // Return top 3 days
  return Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day]) => day);
}

/**
 * Calculate relationship strength
 */
function calculateRelationshipStrength(
  interactionCount: number,
  daysSinceLastInteraction: number
): number {
  // More interactions = stronger relationship
  const countScore = Math.min(interactionCount / 50, 1);

  // More recent interactions = stronger relationship
  const recencyScore = Math.max(0, 1 - daysSinceLastInteraction / 180);

  return countScore * 0.6 + recencyScore * 0.4;
}

/**
 * Calculate email frequency
 */
function calculateEmailFrequency(count: number, emails: any[]): string {
  if (count < 2) return 'Rare';

  const oldest = new Date(emails[emails.length - 1].received_at);
  const newest = new Date(emails[0].received_at);
  const daySpan = (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24);

  const emailsPerDay = count / daySpan;

  if (emailsPerDay >= 1) return 'Daily';
  if (emailsPerDay >= 0.5) return 'Several times a week';
  if (emailsPerDay >= 0.14) return 'Weekly';
  if (emailsPerDay >= 0.033) return 'Monthly';
  return 'Occasional';
}

/**
 * Format duration
 */
function formatDuration(ms: number): string {
  if (ms === 0) return 'No data';

  const minutes = ms / (1000 * 60);
  const hours = minutes / 60;
  const days = hours / 24;

  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  if (hours < 24) return `${Math.round(hours)} hours`;
  if (days < 7) return `${Math.round(days)} days`;
  return `${Math.round(days / 7)} weeks`;
}
