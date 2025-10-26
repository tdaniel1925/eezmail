'use server';

/**
 * Health check for Inngest service
 * Ensures Inngest is running before attempting sync operations
 */
export async function checkInngestHealth(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    // In development, check if Inngest dev server is running
    if (process.env.NODE_ENV === 'development') {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch('http://localhost:8288/health', {
        method: 'GET',
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (response.ok) {
        return { healthy: true };
      }
      return {
        healthy: false,
        error: 'Inngest dev server not responding properly',
      };
    }

    // In production, assume healthy (production uses event keys, not local server)
    return { healthy: true };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      return {
        healthy: false,
        error:
          'Inngest dev server is not running. Start it with: npx inngest-cli@latest dev',
      };
    }
    // In production, log error but don't block
    console.error('Inngest health check failed:', error);
    return { healthy: true }; // Fail open in production
  }
}
