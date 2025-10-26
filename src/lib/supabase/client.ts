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
      flowType: 'implicit', // Changed from 'pkce' to 'implicit' for better compatibility
    },
    global: {
      // Override default headers to prevent non-ASCII characters
      headers: {
        'X-Client-Info': 'supabase-js-web', // Simple ASCII-only client info
      },
    },
  });
}
