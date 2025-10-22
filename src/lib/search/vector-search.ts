/**
 * Vector Search Service
 * Provides semantic search using OpenAI embeddings and pgvector
 */

'use server';

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { generateEmbedding } from '@/lib/rag/embeddings';
import { getCachedSearchResults } from '@/lib/cache/redis-cache';

export interface SemanticSearchResult {
  id: string;
  subject: string | null;
  senderName: string | null;
  senderEmail: string | null;
  receivedAt: Date;
  bodyPreview: string | null;
  similarity: number;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
}

/**
 * Semantic search using vector embeddings
 * Finds emails by meaning, not just keywords
 */
export async function semanticSearch(
  query: string,
  userId: string,
  options: {
    limit?: number;
    minSimilarity?: number;
    includeRead?: boolean;
    folderFilter?: string;
    useCache?: boolean;
  } = {}
): Promise<SemanticSearchResult[]> {
  const {
    limit = 20,
    minSimilarity = 0.7, // 70% similarity threshold
    includeRead = true,
    folderFilter,
    useCache = true,
  } = options;

  try {
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Build SQL query
    let sqlQuery = sql`
      SELECT 
        id,
        subject,
        sender_name,
        sender_email,
        received_at,
        body_preview,
        is_read,
        is_starred,
        has_attachments,
        1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
      FROM emails
      WHERE user_id = ${userId}
        AND embedding IS NOT NULL
    `;

    // Add filters
    if (!includeRead) {
      sqlQuery = sql`${sqlQuery} AND is_read = false`;
    }

    if (folderFilter) {
      sqlQuery = sql`${sqlQuery} AND folder_name = ${folderFilter}`;
    }

    // Add similarity threshold and ordering
    sqlQuery = sql`
      ${sqlQuery}
      AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${minSimilarity}
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `;

    const results = await db.execute(sqlQuery);

    return results.rows.map((row: any) => ({
      id: row.id,
      subject: row.subject,
      senderName: row.sender_name,
      senderEmail: row.sender_email,
      receivedAt: new Date(row.received_at),
      bodyPreview: row.body_preview,
      similarity: parseFloat(row.similarity),
      isRead: row.is_read,
      isStarred: row.is_starred,
      hasAttachments: row.has_attachments,
    }));
  } catch (error) {
    console.error('Semantic search error:', error);
    throw new Error(
      `Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Hybrid search: Combines keyword and semantic search
 * Best of both worlds for comprehensive results
 */
export async function hybridSearch(
  query: string,
  userId: string,
  options: {
    limit?: number;
    semanticWeight?: number; // 0-1, how much to weight semantic vs keyword
    useCache?: boolean;
  } = {}
): Promise<SemanticSearchResult[]> {
  const { limit = 20, semanticWeight = 0.7, useCache = true } = options;

  if (useCache) {
    return getCachedSearchResults(
      userId,
      `hybrid:${query}`,
      1,
      () => performHybridSearch(query, userId, limit, semanticWeight),
      { ttl: 300 }
    );
  }

  return performHybridSearch(query, userId, limit, semanticWeight);
}

async function performHybridSearch(
  query: string,
  userId: string,
  limit: number,
  semanticWeight: number
): Promise<SemanticSearchResult[]> {
  try {
    // Generate embedding for semantic search
    const queryEmbedding = await generateEmbedding(query);

    // Hybrid search SQL
    // Combines vector similarity with full-text search
    const results = await db.execute(sql`
      WITH semantic_results AS (
        SELECT 
          id,
          subject,
          sender_name,
          sender_email,
          received_at,
          body_preview,
          is_read,
          is_starred,
          has_attachments,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as semantic_score
        FROM emails
        WHERE user_id = ${userId}
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT 100
      ),
      keyword_results AS (
        SELECT 
          id,
          subject,
          sender_name,
          sender_email,
          received_at,
          body_preview,
          is_read,
          is_starred,
          has_attachments,
          ts_rank(
            to_tsvector('english', COALESCE(subject, '') || ' ' || COALESCE(body_text, '')),
            plainto_tsquery('english', ${query})
          ) as keyword_score
        FROM emails
        WHERE user_id = ${userId}
          AND (
            to_tsvector('english', COALESCE(subject, '') || ' ' || COALESCE(body_text, ''))
            @@ plainto_tsquery('english', ${query})
          )
        ORDER BY keyword_score DESC
        LIMIT 100
      )
      SELECT DISTINCT ON (id)
        COALESCE(s.id, k.id) as id,
        COALESCE(s.subject, k.subject) as subject,
        COALESCE(s.sender_name, k.sender_name) as sender_name,
        COALESCE(s.sender_email, k.sender_email) as sender_email,
        COALESCE(s.received_at, k.received_at) as received_at,
        COALESCE(s.body_preview, k.body_preview) as body_preview,
        COALESCE(s.is_read, k.is_read) as is_read,
        COALESCE(s.is_starred, k.is_starred) as is_starred,
        COALESCE(s.has_attachments, k.has_attachments) as has_attachments,
        (
          COALESCE(s.semantic_score, 0) * ${semanticWeight} +
          COALESCE(k.keyword_score, 0) * ${1 - semanticWeight}
        ) as combined_score
      FROM semantic_results s
      FULL OUTER JOIN keyword_results k ON s.id = k.id
      ORDER BY combined_score DESC
      LIMIT ${limit}
    `);

    return results.rows.map((row: any) => ({
      id: row.id,
      subject: row.subject,
      senderName: row.sender_name,
      senderEmail: row.sender_email,
      receivedAt: new Date(row.received_at),
      bodyPreview: row.body_preview,
      similarity: parseFloat(row.combined_score || 0),
      isRead: row.is_read,
      isStarred: row.is_starred,
      hasAttachments: row.has_attachments,
    }));
  } catch (error) {
    console.error('Hybrid search error:', error);
    throw new Error(
      `Hybrid search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Find similar emails to a given email
 * Useful for "More like this" feature
 */
export async function findSimilarEmails(
  emailId: string,
  userId: string,
  limit: number = 10
): Promise<SemanticSearchResult[]> {
  try {
    // Get the embedding of the source email
    const sourceEmail = await db.execute(sql`
      SELECT embedding
      FROM emails
      WHERE id = ${emailId} AND user_id = ${userId}
    `);

    if (!sourceEmail.rows[0] || !sourceEmail.rows[0].embedding) {
      throw new Error('Source email not found or has no embedding');
    }

    const sourceEmbedding = sourceEmail.rows[0].embedding;

    // Find similar emails
    const results = await db.execute(sql`
      SELECT 
        id,
        subject,
        sender_name,
        sender_email,
        received_at,
        body_preview,
        is_read,
        is_starred,
        has_attachments,
        1 - (embedding <=> ${JSON.stringify(sourceEmbedding)}::vector) as similarity
      FROM emails
      WHERE user_id = ${userId}
        AND id != ${emailId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${JSON.stringify(sourceEmbedding)}::vector
      LIMIT ${limit}
    `);

    return results.rows.map((row: any) => ({
      id: row.id,
      subject: row.subject,
      senderName: row.sender_name,
      senderEmail: row.sender_email,
      receivedAt: new Date(row.received_at),
      bodyPreview: row.body_preview,
      similarity: parseFloat(row.similarity),
      isRead: row.is_read,
      isStarred: row.is_starred,
      hasAttachments: row.has_attachments,
    }));
  } catch (error) {
    console.error('Find similar emails error:', error);
    throw new Error(
      `Find similar emails failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get search suggestions based on query
 * Uses semantic search to suggest related topics
 */
export async function getSearchSuggestions(
  query: string,
  userId: string,
  limit: number = 5
): Promise<string[]> {
  try {
    const results = await semanticSearch(query, userId, {
      limit,
      minSimilarity: 0.6,
    });

    // Extract unique subjects as suggestions
    const suggestions = results
      .map((r) => r.subject)
      .filter((s): s is string => s !== null && s.length > 0)
      .slice(0, limit);

    return suggestions;
  } catch (error) {
    console.error('Get search suggestions error:', error);
    return [];
  }
}
