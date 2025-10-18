'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { generateEmbedding } from './embeddings';

export interface SearchResult {
  id: string;
  subject: string;
  bodyText: string | null;
  fromAddress: any;
  receivedAt: Date;
  similarity: number;
}

/**
 * Perform semantic search across user's emails
 * 
 * @param query - Natural language search query
 * @param userId - User ID to filter results
 * @param options - Search options
 * @returns Array of matching emails with similarity scores
 */
export async function searchEmails(
  query: string,
  userId: string,
  options: {
    limit?: number;
    threshold?: number;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}
): Promise<{
  success: boolean;
  results: SearchResult[];
  error?: string;
}> {
  const {
    limit = 10,
    threshold = 0.7, // 70% similarity minimum
  } = options;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, results: [], error: 'Unauthorized' };
    }

    if (!query || query.trim().length === 0) {
      return { success: false, results: [], error: 'Query cannot be empty' };
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Call the Supabase function for vector similarity search
    const { data, error } = await supabase.rpc('match_emails', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_user_id: userId,
    });

    if (error) {
      console.error('Error searching emails:', error);
      return { success: false, results: [], error: error.message };
    }

    // Format results
    const results: SearchResult[] = (data || []).map((item: any) => ({
      id: item.id,
      subject: item.subject || '(No subject)',
      bodyText: item.body_text,
      fromAddress: item.from_address,
      receivedAt: new Date(item.received_at),
      similarity: item.similarity,
    }));

    return { success: true, results };
  } catch (error) {
    console.error('Error in searchEmails:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Find emails similar to a given email
 * Useful for "find related emails" feature
 */
export async function findSimilarEmails(
  emailId: string,
  userId: string,
  limit: number = 5
): Promise<{
  success: boolean;
  results: SearchResult[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, results: [], error: 'Unauthorized' };
    }

    // Get the email's embedding
    const { data: emailData, error: emailError } = await supabase
      .from('emails')
      .select('embedding')
      .eq('id', emailId)
      .single();

    if (emailError || !emailData?.embedding) {
      return {
        success: false,
        results: [],
        error: 'Email not found or not embedded',
      };
    }

    // Search using the email's embedding
    const { data, error } = await supabase.rpc('match_emails', {
      query_embedding: emailData.embedding,
      match_threshold: 0.75,
      match_count: limit + 1, // +1 to exclude the original email
      filter_user_id: userId,
    });

    if (error) {
      return { success: false, results: [], error: error.message };
    }

    // Filter out the original email and format results
    const results: SearchResult[] = (data || [])
      .filter((item: any) => item.id !== emailId)
      .slice(0, limit)
      .map((item: any) => ({
        id: item.id,
        subject: item.subject || '(No subject)',
        bodyText: item.body_text,
        fromAddress: item.from_address,
        receivedAt: new Date(item.received_at),
        similarity: item.similarity,
      }));

    return { success: true, results };
  } catch (error) {
    console.error('Error in findSimilarEmails:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search emails from a specific sender
 * Combines semantic search with sender filtering
 */
export async function searchEmailsFromSender(
  query: string,
  senderEmail: string,
  userId: string,
  limit: number = 10
): Promise<{
  success: boolean;
  results: SearchResult[];
  error?: string;
}> {
  try {
    // First do semantic search
    const searchResult = await searchEmails(query, userId, { limit: limit * 2 });

    if (!searchResult.success) {
      return searchResult;
    }

    // Filter by sender
    const filtered = searchResult.results.filter((email) => {
      const from =
        typeof email.fromAddress === 'string'
          ? email.fromAddress
          : email.fromAddress?.email || '';
      return from.toLowerCase().includes(senderEmail.toLowerCase());
    });

    return {
      success: true,
      results: filtered.slice(0, limit),
    };
  } catch (error) {
    console.error('Error in searchEmailsFromSender:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

