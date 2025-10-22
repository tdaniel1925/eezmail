/**
 * Server-Side Redis Cache Service
 * Provides distributed caching for email lists, search results, and AI responses
 */

'use server';

import {
  getCached,
  setCached,
  deleteCached,
  invalidateCache,
  CacheKeys,
} from '../redis/client';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  skipCache?: boolean; // Skip cache for this request
}

/**
 * Get email list with caching
 */
export async function getCachedEmailList<T>(
  userId: string,
  folder: string,
  page: number,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 180, skipCache = false } = options; // Default 3 minutes

  if (skipCache) {
    return await fetcher();
  }

  const key = CacheKeys.emailList(userId, folder, page);

  // Try to get from cache
  const cached = await getCached<T>(key);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache the result
  await setCached(key, data, ttl);

  return data;
}

/**
 * Get email details with caching
 */
export async function getCachedEmail<T>(
  emailId: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 600, skipCache = false } = options; // Default 10 minutes

  if (skipCache) {
    return await fetcher();
  }

  const key = CacheKeys.emailDetail(emailId);

  const cached = await getCached<T>(key);
  if (cached) {
    return cached;
  }

  const data = await fetcher();
  await setCached(key, data, ttl);

  return data;
}

/**
 * Get search results with caching
 */
export async function getCachedSearchResults<T>(
  userId: string,
  query: string,
  page: number,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300, skipCache = false } = options; // Default 5 minutes

  if (skipCache) {
    return await fetcher();
  }

  const key = CacheKeys.searchResults(userId, query, page);

  const cached = await getCached<T>(key);
  if (cached) {
    return cached;
  }

  const data = await fetcher();
  await setCached(key, data, ttl);

  return data;
}

/**
 * Get AI summary with caching
 */
export async function getCachedAISummary(
  emailId: string,
  generator: () => Promise<string>,
  options: CacheOptions = {}
): Promise<string> {
  const { ttl = 604800, skipCache = false } = options; // Default 7 days

  if (skipCache) {
    return await generator();
  }

  const key = CacheKeys.aiSummary(emailId);

  const cached = await getCached<string>(key);
  if (cached) {
    return cached;
  }

  const summary = await generator();
  await setCached(key, summary, ttl);

  return summary;
}

/**
 * Get AI quick replies with caching
 */
export async function getCachedAIReplies<T>(
  emailId: string,
  generator: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 3600, skipCache = false } = options; // Default 1 hour

  if (skipCache) {
    return await generator();
  }

  const key = CacheKeys.aiQuickReplies(emailId);

  const cached = await getCached<T>(key);
  if (cached) {
    return cached;
  }

  const replies = await generator();
  await setCached(key, replies, ttl);

  return replies;
}

/**
 * Get folder counts with caching
 */
export async function getCachedFolderCounts<T>(
  userId: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 60, skipCache = false } = options; // Default 1 minute

  if (skipCache) {
    return await fetcher();
  }

  const key = CacheKeys.folderCounts(userId);

  const cached = await getCached<T>(key);
  if (cached) {
    return cached;
  }

  const counts = await fetcher();
  await setCached(key, counts, ttl);

  return counts;
}

/**
 * Invalidate all email caches for a user
 * Call this after sync, send, delete, etc.
 */
export async function invalidateUserEmailCache(userId: string): Promise<void> {
  await Promise.all([
    invalidateCache(`emails:${userId}:*`),
    invalidateCache(`folders:${userId}`),
    invalidateCache(`search:${userId}:*`),
  ]);
}

/**
 * Invalidate specific email cache
 * Call this after email update
 */
export async function invalidateEmailCache(emailId: string): Promise<void> {
  await Promise.all([
    deleteCached(CacheKeys.emailDetail(emailId)),
    deleteCached(CacheKeys.aiSummary(emailId)),
    deleteCached(CacheKeys.aiQuickReplies(emailId)),
    deleteCached(CacheKeys.aiActions(emailId)),
  ]);
}

/**
 * Invalidate AI caches (use sparingly)
 */
export async function invalidateAICache(): Promise<void> {
  await invalidateCache('ai:*');
}

/**
 * Cache warming - preload frequently accessed data
 */
export async function warmCache(
  userId: string,
  folders: string[]
): Promise<void> {
  // This would be called by a cron job
  // Preload first page of each folder
  console.log(`Warming cache for user ${userId}, folders:`, folders);
  // Implementation would fetch and cache data
}
