/**
 * Global fetch wrapper to sanitize all headers
 * Prevents ISO-8859-1 errors by stripping non-ASCII characters from headers
 */

export function initFetchSanitizer() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;

  window.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // Sanitize headers if present
    if (init?.headers) {
      const sanitizedHeaders: Record<string, string> = {};

      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          // Remove non-ASCII characters from header values
          sanitizedHeaders[key] = value.replace(/[^\x00-\x7F]/g, '');
        });
        init.headers = sanitizedHeaders as any;
      } else if (Array.isArray(init.headers)) {
        init.headers = init.headers.map(([key, value]) => [
          key,
          typeof value === 'string' ? value.replace(/[^\x00-\x7F]/g, '') : value,
        ]) as any;
      } else {
        // Plain object
        Object.entries(init.headers).forEach(([key, value]) => {
          sanitizedHeaders[key] =
            typeof value === 'string' ? value.replace(/[^\x00-\x7F]/g, '') : value;
        });
        init.headers = sanitizedHeaders;
      }
    }

    return originalFetch(input, init);
  };

  console.log('[FETCH SANITIZER] Header sanitization installed');
}


