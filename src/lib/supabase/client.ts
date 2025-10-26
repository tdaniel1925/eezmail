import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Allow build without Supabase keys (will fail at runtime if actually used)
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  console.log('[SUPABASE CLIENT] Creating client with URL:', supabaseUrl);

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
    global: {
      // Remove all custom headers to avoid ISO-8859-1 issues
      headers: {},
      fetch: (url, options = {}) => {
        // Strip any non-ASCII characters from headers
        if (options.headers) {
          const cleanHeaders: Record<string, string> = {};
          const headers = options.headers as Record<string, string>;
          
          Object.keys(headers).forEach((key) => {
            const value = headers[key];
            if (typeof value === 'string') {
              // Only keep ASCII characters (0-127)
              cleanHeaders[key] = value.replace(/[^\x00-\x7F]/g, '');
            } else {
              cleanHeaders[key] = value;
            }
          });
          
          options.headers = cleanHeaders;
        }
        
        return fetch(url, options);
      },
    },
  });
}
