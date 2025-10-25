import { tavily } from '@tavily/core';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!TAVILY_API_KEY) {
  console.warn(
    '⚠️ TAVILY_API_KEY not set - Internet search fallback will not work'
  );
}

const client = TAVILY_API_KEY ? tavily({ apiKey: TAVILY_API_KEY }) : null;

export interface TavilySearchResult {
  title: string;
  content: string;
  url: string;
  score: number;
}

/**
 * Search the internet for information using Tavily API
 *
 * @param query - Search query
 * @param options - Search options
 * @returns Array of search results
 */
export async function searchInternet(
  query: string,
  options: {
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
    includeAnswer?: boolean;
  } = {}
): Promise<{
  success: boolean;
  results: TavilySearchResult[];
  answer?: string;
  error?: string;
}> {
  if (!client) {
    return {
      success: false,
      results: [],
      error: 'Tavily API key not configured',
    };
  }

  try {
    console.log(`🔍 [Tavily] Searching internet for: "${query}"`);

    const response = await client.search(query, {
      searchDepth: options.searchDepth || 'basic',
      maxResults: options.maxResults || 3,
      includeAnswer: options.includeAnswer !== false, // Default true
    });

    const results: TavilySearchResult[] = response.results.map((r: any) => ({
      title: r.title,
      content: r.content,
      url: r.url,
      score: r.score || 0,
    }));

    console.log(`✅ [Tavily] Found ${results.length} result(s)`);

    return {
      success: true,
      results,
      answer: response.answer || undefined,
    };
  } catch (error) {
    console.error('❌ [Tavily] Search error:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format search results for AI context
 *
 * @param results - Tavily search results
 * @returns Formatted string for AI prompt
 */
export function formatSearchResults(results: TavilySearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.';
  }

  let formatted = 'Here are relevant search results from the internet:\n\n';

  results.forEach((result, index) => {
    formatted += `${index + 1}. **${result.title}**\n`;
    formatted += `   ${result.content}\n`;
    formatted += `   Source: ${result.url}\n\n`;
  });

  return formatted.trim();
}

/**
 * Check if query is about email/contacts/calendar (internal data)
 * or general knowledge (requires internet search)
 *
 * @param query - User query
 * @returns true if query is about general knowledge
 */
export function isGeneralKnowledgeQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();

  // Keywords that indicate email-related queries (no search needed)
  const emailKeywords = [
    'email',
    'message',
    'inbox',
    'send',
    'reply',
    'forward',
    'contact',
    'calendar',
    'meeting',
    'schedule',
    'draft',
    'folder',
    'search',
    'find',
    'archive',
    'delete',
    'star',
    'unread',
    'attachment',
  ];

  // If query contains email keywords, it's probably internal
  const hasEmailKeyword = emailKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  // General knowledge question indicators
  const generalKeywords = [
    'what is',
    'who is',
    'when did',
    'where is',
    'how to',
    'why does',
    'define',
    'explain',
    'tell me about',
    'what are',
    'how does',
    'can you explain',
  ];

  const hasGeneralKeyword = generalKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  // If it has general knowledge indicators and no email keywords, likely needs search
  return hasGeneralKeyword && !hasEmailKeyword;
}
