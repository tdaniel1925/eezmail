/**
 * Simple in-memory rate limiter for API endpoints
 * No external dependencies required
 */

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  identifier: string,
  limit: number
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Date.now();
  const windowMs = 60000; // 1 minute window

  const record = rateLimitStore.get(identifier);

  // Periodically clean up old entries (1% chance on each call)
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime + 60000) {
        rateLimitStore.delete(key);
      }
    }
  }

  // New window or expired window
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { success: true, remaining: limit - 1, reset: resetTime };
  }

  // Limit exceeded
  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.resetTime };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(identifier, record);
  return {
    success: true,
    remaining: limit - record.count,
    reset: record.resetTime,
  };
}
