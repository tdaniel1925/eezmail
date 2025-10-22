/**
 * Redis Client using Upstash
 * Provides server-side caching and distributed rate limiting
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Get cached value with type safety
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value as T | null;
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set cached value with TTL (time to live in seconds)
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  try {
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } else {
      await redis.set(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
  }
}

/**
 * Delete cached value
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error);
  }
}

/**
 * Delete multiple keys matching a pattern
 * Note: Use sparingly, can be slow with many keys
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Redis invalidation error for pattern ${pattern}:`, error);
  }
}

/**
 * Increment a counter (useful for rate limiting)
 */
export async function increment(key: string): Promise<number> {
  try {
    return await redis.incr(key);
  } catch (error) {
    console.error(`Redis INCR error for key ${key}:`, error);
    return 0;
  }
}

/**
 * Set expiry on a key
 */
export async function expire(key: string, seconds: number): Promise<void> {
  try {
    await redis.expire(key, seconds);
  } catch (error) {
    console.error(`Redis EXPIRE error for key ${key}:`, error);
  }
}

/**
 * Check if key exists
 */
export async function exists(key: string): Promise<boolean> {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    console.error(`Redis EXISTS error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get TTL (time to live) for a key in seconds
 */
export async function getTTL(key: string): Promise<number> {
  try {
    return await redis.ttl(key);
  } catch (error) {
    console.error(`Redis TTL error for key ${key}:`, error);
    return -1;
  }
}

/**
 * Distributed lock implementation
 * Useful for preventing concurrent operations
 */
export async function acquireLock(
  lockKey: string,
  ttlSeconds: number = 10
): Promise<boolean> {
  try {
    const result = await redis.set(lockKey, '1', {
      ex: ttlSeconds,
      nx: true, // Only set if key doesn't exist
    });
    return result === 'OK';
  } catch (error) {
    console.error(`Redis LOCK error for key ${lockKey}:`, error);
    return false;
  }
}

/**
 * Release distributed lock
 */
export async function releaseLock(lockKey: string): Promise<void> {
  try {
    await redis.del(lockKey);
  } catch (error) {
    console.error(`Redis UNLOCK error for key ${lockKey}:`, error);
  }
}

/**
 * Execute function with lock (automatically acquire and release)
 */
export async function withLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 10
): Promise<T | null> {
  const acquired = await acquireLock(lockKey, ttlSeconds);

  if (!acquired) {
    console.warn(`Could not acquire lock: ${lockKey}`);
    return null;
  }

  try {
    return await fn();
  } finally {
    await releaseLock(lockKey);
  }
}

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
  // Email caching
  emailList: (userId: string, folder: string, page: number = 1) =>
    `emails:${userId}:${folder}:page:${page}`,

  emailDetail: (emailId: string) => `email:${emailId}`,

  emailThread: (threadId: string) => `thread:${threadId}`,

  // Search caching
  searchResults: (userId: string, query: string, page: number = 1) =>
    `search:${userId}:${encodeURIComponent(query)}:${page}`,

  // AI caching
  aiSummary: (emailId: string) => `ai:summary:${emailId}`,

  aiQuickReplies: (emailId: string) => `ai:replies:${emailId}`,

  aiActions: (emailId: string) => `ai:actions:${emailId}`,

  // Rate limiting
  rateLimit: (identifier: string, window: string) =>
    `ratelimit:${identifier}:${window}`,

  // User data
  userProfile: (userId: string) => `user:${userId}`,

  userSettings: (userId: string) => `settings:${userId}`,

  folderCounts: (userId: string) => `folders:${userId}`,

  // Lock keys
  syncLock: (accountId: string) => `lock:sync:${accountId}`,

  emailProcessLock: (emailId: string) => `lock:email:${emailId}`,
};

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}
