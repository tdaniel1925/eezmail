import { searchEmails, SearchResult } from './search';

export interface EmailContext {
  query: string;
  relevantEmails: SearchResult[];
  summary: string;
  totalFound: number;
}

/**
 * Build context from relevant emails for AI chat
 * Retrieves semantically similar emails and formats them for AI consumption
 * 
 * @server-action This is a server action (async + can only be called from client)
 */
export async function buildContextForQuery(
  query: string,
  userId: string,
  maxEmails: number = 5
): Promise<EmailContext> {
  // Search for relevant emails
  const searchResult = await searchEmails(query, userId, {
    limit: maxEmails,
    threshold: 0.72, // Slightly higher threshold for better relevance
  });

  if (!searchResult.success || searchResult.results.length === 0) {
    return {
      query,
      relevantEmails: [],
      summary: 'No relevant emails found.',
      totalFound: 0,
    };
  }

  // Build summary
  const summary = buildEmailSummary(searchResult.results);

  return {
    query,
    relevantEmails: searchResult.results,
    summary,
    totalFound: searchResult.results.length,
  };
}

/**
 * Build a text summary of emails for AI context
 */
function buildEmailSummary(emails: SearchResult[]): string {
  if (emails.length === 0) {
    return 'No relevant emails found.';
  }

  const summaries = emails.map((email, index) => {
    const from =
      typeof email.fromAddress === 'string'
        ? email.fromAddress
        : email.fromAddress?.name || email.fromAddress?.email || 'Unknown';

    const date = email.receivedAt.toLocaleDateString();
    const preview = (email.bodyText || '').substring(0, 200);

    return `Email ${index + 1}:
From: ${from}
Date: ${date}
Subject: ${email.subject}
Preview: ${preview}${preview.length === 200 ? '...' : ''}
Relevance: ${(email.similarity * 100).toFixed(0)}%
---`;
  });

  return `Found ${emails.length} relevant email(s):\n\n${summaries.join('\n')}`;
}

/**
 * Deduplicate search results by email ID
 */
export function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.id)) {
      return false;
    }
    seen.add(result.id);
    return true;
  });
}

/**
 * Rank results by combining similarity score with recency
 * More recent emails get a boost
 */
export function rankResults(
  results: SearchResult[],
  recencyWeight: number = 0.3
): SearchResult[] {
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  return results
    .map((result) => {
      const daysSinceReceived = (now - result.receivedAt.getTime()) / (24 * 60 * 60 * 1000);
      const recencyScore = Math.max(0, 1 - daysSinceReceived / 365); // Decay over a year
      const combinedScore =
        result.similarity * (1 - recencyWeight) + recencyScore * recencyWeight;

      return {
        ...result,
        combinedScore,
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore);
}

/**
 * Filter results by date range
 */
export function filterByDateRange(
  results: SearchResult[],
  startDate?: Date,
  endDate?: Date
): SearchResult[] {
  return results.filter((result) => {
    if (startDate && result.receivedAt < startDate) {
      return false;
    }
    if (endDate && result.receivedAt > endDate) {
      return false;
    }
    return true;
  });
}

/**
 * Group results by sender
 */
export function groupBySender(results: SearchResult[]): Map<string, SearchResult[]> {
  const groups = new Map<string, SearchResult[]>();

  results.forEach((result) => {
    const senderEmail =
      typeof result.fromAddress === 'string'
        ? result.fromAddress
        : result.fromAddress?.email || 'unknown';

    const existing = groups.get(senderEmail) || [];
    groups.set(senderEmail, [...existing, result]);
  });

  return groups;
}

/**
 * Extract key topics from search results
 * Simple keyword extraction from subjects and bodies
 */
export function extractKeyTopics(results: SearchResult[], topN: number = 5): string[] {
  const wordFreq = new Map<string, number>();

  // Common words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
  ]);

  results.forEach((result) => {
    const text = `${result.subject} ${result.bodyText || ''}`.toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];

    words.forEach((word) => {
      if (!stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });
  });

  // Sort by frequency and return top N
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

