'use server';

import { db } from '@/lib/db';
import { userAIProfiles, emails, emailAccounts } from '@/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * User Profile Analysis Service
 * Learns user's writing style, communication patterns, and behavioral patterns
 */

interface WritingStyleProfile {
  tone?: string; // professional, casual, friendly, formal
  formality?: string; // very formal, formal, neutral, informal, very informal
  wordChoicePatterns?: string[]; // commonly used words
}

interface ActiveHours {
  start?: number; // 0-23 (hour of day)
  end?: number; // 0-23
}

/**
 * Analyze a user's writing style from their sent emails
 */
export async function analyzeWritingStyle(userId: string): Promise<void> {
  console.log(`📊 [Profile] Analyzing writing style for user: ${userId}`);

  try {
    // Get user's sent emails from the last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get user's email account IDs
    const accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, userId),
      columns: { id: true },
    });

    if (accounts.length === 0) {
      console.log(`⚠️ [Profile] No email accounts found for user: ${userId}`);
      return;
    }

    const accountIds = accounts.map((a) => a.id);

    // Fetch sent emails
    const sentEmails = await db.query.emails.findMany({
      where: and(
        eq(emails.accountId, accountIds[0]), // Start with first account
        eq(emails.folder, 'sent'),
        gte(emails.receivedAt, sixtyDaysAgo)
      ),
      orderBy: [desc(emails.receivedAt)],
      limit: 50, // Analyze last 50 sent emails
    });

    if (sentEmails.length === 0) {
      console.log(`⚠️ [Profile] No sent emails found for analysis`);
      return;
    }

    console.log(`📧 [Profile] Found ${sentEmails.length} sent emails for analysis`);

    // Prepare email samples for AI analysis
    const emailSamples = sentEmails
      .map((email) => {
        const body = email.bodyPlain || email.bodyHtml || '';
        return body.substring(0, 500); // First 500 chars
      })
      .filter((body) => body.length > 50); // Only meaningful emails

    if (emailSamples.length === 0) {
      console.log(`⚠️ [Profile] No valid email samples for analysis`);
      return;
    }

    // Use AI to analyze writing style
    const analysisPrompt = `Analyze the following email samples written by a user and provide a detailed analysis of their writing style:

Email Samples:
${emailSamples.slice(0, 10).map((sample, i) => `\n[Email ${i + 1}]\n${sample}`).join('\n')}

Provide a JSON analysis with the following structure:
{
  "tone": "professional" | "casual" | "friendly" | "formal" | "mixed",
  "formality": "very formal" | "formal" | "neutral" | "informal" | "very informal",
  "commonPhrases": ["phrase1", "phrase2", ...],
  "vocabularyLevel": "simple" | "moderate" | "advanced",
  "avgEmailLength": estimated_word_count,
  "greetingStyle": "most common greeting like 'Hi', 'Hey', 'Hello'",
  "closingStyle": "most common closing like 'Best', 'Thanks', 'Cheers'",
  "preferredTone": "professional" | "casual" | "friendly",
  "emojiUsage": true | false,
  "wordChoicePatterns": ["commonly used words or patterns"]
}

Be precise and based on evidence from the samples.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a writing style analyst. Analyze email writing patterns and return only valid JSON.',
        },
        { role: 'user', content: analysisPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    console.log(`✅ [Profile] Analysis complete:`, analysis);

    // Calculate active hours from email timestamps
    const hours = sentEmails.map((email) => new Date(email.receivedAt).getHours());
    const hourCounts = new Map<number, number>();
    hours.forEach((hour) => {
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    // Find peak hours (most emails sent)
    let peakHour = 9; // default
    let maxCount = 0;
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    });

    const activeHours: ActiveHours = {
      start: Math.max(0, peakHour - 4),
      end: Math.min(23, peakHour + 4),
    };

    // Calculate response time average (rough estimate from email intervals)
    const responseTimeAvg = 60; // Default to 60 minutes

    // Find frequent contacts (top recipients)
    const recipients = sentEmails
      .map((email) => email.toAddress)
      .filter((addr) => addr && addr.length > 0);
    const recipientCounts = new Map<string, number>();
    recipients.forEach((recipient) => {
      recipientCounts.set(recipient, (recipientCounts.get(recipient) || 0) + 1);
    });

    const frequentContacts = Array.from(recipientCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map((entry) => entry[0]);

    // Extract common topics from subjects
    const subjects = sentEmails.map((email) => email.subject || '').filter((s) => s.length > 0);
    const commonTopics = extractTopicsFromSubjects(subjects);

    // Upsert user AI profile
    const existingProfile = await db.query.userAIProfiles.findFirst({
      where: eq(userAIProfiles.userId, userId),
    });

    const writingStyle: WritingStyleProfile = {
      tone: analysis.tone,
      formality: analysis.formality,
      wordChoicePatterns: analysis.wordChoicePatterns || [],
    };

    const profileData = {
      userId,
      writingStyle,
      commonPhrases: analysis.commonPhrases || [],
      vocabularyLevel: analysis.vocabularyLevel || 'moderate',
      avgEmailLength: analysis.avgEmailLength || 200,
      greetingStyle: analysis.greetingStyle || 'Hi',
      closingStyle: analysis.closingStyle || 'Best',
      responseTimeAvg,
      activeHours,
      preferredTone: analysis.preferredTone || 'professional',
      emojiUsage: analysis.emojiUsage || false,
      frequentContacts,
      commonTopics,
      lastAnalyzedAt: new Date(),
      totalEmailsAnalyzed: sentEmails.length,
      updatedAt: new Date(),
    };

    if (existingProfile) {
      await db
        .update(userAIProfiles)
        .set(profileData)
        .where(eq(userAIProfiles.userId, userId));
      console.log(`✅ [Profile] Updated profile for user: ${userId}`);
    } else {
      await db.insert(userAIProfiles).values(profileData);
      console.log(`✅ [Profile] Created new profile for user: ${userId}`);
    }
  } catch (error) {
    console.error(`❌ [Profile] Error analyzing writing style:`, error);
    throw error;
  }
}

/**
 * Get user's writing style profile
 */
export async function getWritingStyleProfile(userId: string) {
  const profile = await db.query.userAIProfiles.findFirst({
    where: eq(userAIProfiles.userId, userId),
  });

  if (!profile) {
    console.log(`⚠️ [Profile] No profile found for user: ${userId}, analyzing now...`);
    await analyzeWritingStyle(userId);
    return await db.query.userAIProfiles.findFirst({
      where: eq(userAIProfiles.userId, userId),
    });
  }

  // Check if profile is stale (older than 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (profile.lastAnalyzedAt && profile.lastAnalyzedAt < sevenDaysAgo) {
    console.log(`🔄 [Profile] Profile is stale, re-analyzing...`);
    // Re-analyze in background (don't await)
    analyzeWritingStyle(userId).catch((err) =>
      console.error(`Error re-analyzing profile:`, err)
    );
  }

  return profile;
}

/**
 * Apply user's writing style to generated text
 */
export async function applyUserStyleToText(
  text: string,
  userId: string
): Promise<string> {
  const profile = await getWritingStyleProfile(userId);

  if (!profile) {
    return text; // No profile, return as-is
  }

  // Use AI to rewrite text in user's style
  const stylePrompt = `Rewrite the following text to match this writing style:

Tone: ${profile.preferredTone}
Formality: ${(profile.writingStyle as WritingStyleProfile)?.formality || 'neutral'}
Common greeting: ${profile.greetingStyle}
Common closing: ${profile.closingStyle}
Vocabulary level: ${profile.vocabularyLevel}
Emoji usage: ${profile.emojiUsage ? 'yes' : 'no'}
Common phrases: ${profile.commonPhrases.join(', ')}

Original text:
${text}

Rewritten text (maintain the same meaning but adjust tone and style):`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a writing style adapter. Rewrite text to match a specific style.',
      },
      { role: 'user', content: stylePrompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const styledText = completion.choices[0].message.content || text;
  console.log(`✨ [Profile] Applied user style to text`);

  return styledText;
}

/**
 * Update profile from a single email (incremental learning)
 */
export async function updateProfileFromEmail(
  userId: string,
  emailId: string
): Promise<void> {
  // For now, just trigger a full re-analysis
  // In production, implement incremental updates
  console.log(`🔄 [Profile] Triggering re-analysis from email: ${emailId}`);
  await analyzeWritingStyle(userId);
}

/**
 * Extract common topics from email subjects
 */
function extractTopicsFromSubjects(subjects: string[]): string[] {
  // Simple keyword extraction (in production, use NLP)
  const words = subjects
    .join(' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4); // Only words longer than 4 chars

  const wordCounts = new Map<string, number>();
  words.forEach((word) => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });

  // Get top 10 most common words as topics
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((entry) => entry[0]);
}

/**
 * Get profile statistics for display
 */
export async function getProfileStats(userId: string) {
  const profile = await getWritingStyleProfile(userId);

  if (!profile) {
    return null;
  }

  return {
    writingStyle: (profile.writingStyle as WritingStyleProfile)?.tone || 'unknown',
    formality: (profile.writingStyle as WritingStyleProfile)?.formality || 'unknown',
    totalEmailsAnalyzed: profile.totalEmailsAnalyzed,
    lastAnalyzedAt: profile.lastAnalyzedAt,
    frequentContactsCount: profile.frequentContacts.length,
    commonTopicsCount: profile.commonTopics.length,
  };
}

