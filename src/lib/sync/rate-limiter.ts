/**
 * Rate Limiter for API Calls
 * Prevents exceeding provider API limits (Gmail, Outlook, Nylas)
 */

// In-memory rate limit tracking (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
  accountId?: string;
  provider?: string;
}

/**
 * Default rate limits by provider
 */
export const PROVIDER_RATE_LIMITS: Record<string, RateLimitConfig> = {
  gmail: {
    maxRequests: 250, // Gmail API quota: 250 req/sec per user
    windowMs: 1000,
  },
  outlook: {
    maxRequests: 240, // Microsoft Graph: ~240 req/min per user
    windowMs: 60000,
  },
  nylas: {
    maxRequests: 500, // Nylas API: 500 req/sec
    windowMs: 1000,
  },
  default: {
    maxRequests: 100,
    windowMs: 60000,
  },
};

/**
 * Check if request is within rate limit
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}> {
  const now = Date.now();
  const limit = rateLimitStore.get(key);

  // No existing limit or window expired
  if (!limit || now >= limit.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Within window
  if (limit.count < config.maxRequests) {
    limit.count++;
    rateLimitStore.set(key, limit);

    return {
      allowed: true,
      remaining: config.maxRequests - limit.count,
      resetAt: limit.resetAt,
    };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((limit.resetAt - now) / 1000);

  return {
    allowed: false,
    remaining: 0,
    resetAt: limit.resetAt,
    retryAfter,
  };
}

/**
 * Wait for rate limit window to reset
 */
export async function waitForRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<void> {
  const result = await checkRateLimit(key, config);

  if (!result.allowed && result.retryAfter) {
    await new Promise((resolve) =>
      setTimeout(resolve, result.retryAfter! * 1000)
    );
  }
}

/**
 * Execute function with rate limiting
 */
export async function withRateLimit<T>(
  key: string,
  config: RateLimitConfig,
  fn: () => Promise<T>
): Promise<T> {
  // Check rate limit
  const result = await checkRateLimit(key, config);

  if (!result.allowed) {
    // Wait for rate limit to reset
    await waitForRateLimit(key, config);
  }

  // Execute function
  return await fn();
}

/**
 * Get rate limit for account based on provider
 */
export async function getAccountRateLimit(
  accountId: string,
  provider: 'gmail' | 'outlook' | 'nylas' | 'default'
): Promise<RateLimitConfig> {
  const baseConfig =
    PROVIDER_RATE_LIMITS[provider] || PROVIDER_RATE_LIMITS.default;

  return {
    ...baseConfig,
    accountId,
    provider,
  };
}

/**
 * Batch requests with rate limiting
 */
export async function batchWithRateLimit<T, R>(
  items: T[],
  batchSize: number,
  rateLimitKey: string,
  rateLimitConfig: RateLimitConfig,
  processFn: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Apply rate limiting
    await waitForRateLimit(rateLimitKey, rateLimitConfig);

    // Process batch
    const batchResults = await processFn(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Throttle function calls (useful for API requests)
 */
export function createThrottle(
  delayMs: number
): <T>(fn: () => Promise<T>) => Promise<T> {
  let lastCall = 0;

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall < delayMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs - timeSinceLastCall)
      );
    }

    lastCall = Date.now();
    return await fn();
  };
}

/**
 * Adaptive rate limiting based on response headers
 */
export function parseRateLimitHeaders(headers: Record<string, string>): {
  limit?: number;
  remaining?: number;
  reset?: number;
  retryAfter?: number;
} {
  return {
    limit: headers['x-ratelimit-limit']
      ? parseInt(headers['x-ratelimit-limit'])
      : undefined,
    remaining: headers['x-ratelimit-remaining']
      ? parseInt(headers['x-ratelimit-remaining'])
      : undefined,
    reset: headers['x-ratelimit-reset']
      ? parseInt(headers['x-ratelimit-reset'])
      : undefined,
    retryAfter: headers['retry-after']
      ? parseInt(headers['retry-after'])
      : undefined,
  };
}

/**
 * Update rate limit config based on API response
 */
export async function updateRateLimitFromResponse(
  key: string,
  headers: Record<string, string>
): Promise<void> {
  const parsed = parseRateLimitHeaders(headers);

  if (parsed.remaining !== undefined && parsed.reset) {
    rateLimitStore.set(key, {
      count: (parsed.limit || 0) - parsed.remaining,
      resetAt: parsed.reset * 1000,
    });
  }
}

/**
 * Clear rate limit for key (useful for testing)
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(key: string): Promise<{
  count: number;
  resetAt: number;
  resetIn: number;
} | null> {
  const limit = rateLimitStore.get(key);

  if (!limit) return null;

  return {
    count: limit.count,
    resetAt: limit.resetAt,
    resetIn: Math.max(0, limit.resetAt - Date.now()),
  };
}
