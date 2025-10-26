import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  // Allow build without Supabase keys (will fail at runtime if actually used)
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  
  // Strip BOM and non-ASCII characters from API key (Vercel env vars sometimes have invisible BOM)
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  const supabaseAnonKey = rawAnonKey.replace(/^\uFEFF/, '').replace(/[^\x00-\x7F]/g, '');

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
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
