import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Track redirect loops
const redirectCount = new Map<string, number>();

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Allow build without Supabase keys (will fail at runtime if actually used)
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Debug: Log cookies to see what's being sent
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname === '/login') {
    const allCookies = request.cookies.getAll();
    const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'));
    console.log('[MIDDLEWARE] Path:', request.nextUrl.pathname);
    console.log('[MIDDLEWARE] Total cookies:', allCookies.length);
    console.log('[MIDDLEWARE] Supabase cookies:', supabaseCookies.map(c => c.name).join(', ') || 'NONE');
    console.log('[MIDDLEWARE] User:', user ? `✅ ${user.email}` : '❌ Not authenticated');
  }

  // Detect redirect loops
  const clientId = request.headers.get('user-agent') || 'unknown';
  const loopKey = `${clientId}-${request.nextUrl.pathname}`;
  const count = (redirectCount.get(loopKey) || 0) + 1;
  redirectCount.set(loopKey, count);
  
  // Clear old entries after 10 seconds
  setTimeout(() => redirectCount.delete(loopKey), 10000);
  
  if (count > 5) {
    console.error('[MIDDLEWARE] ⚠️ REDIRECT LOOP DETECTED!', request.nextUrl.pathname, 'Count:', count);
    console.error('[MIDDLEWARE] User:', user?.email || 'Not authenticated');
    // Break the loop by allowing the request through
    return supabaseResponse;
  }

  // Only log every 3rd request to reduce spam
  if (count % 3 === 1) {
    console.log('[MIDDLEWARE]', request.nextUrl.pathname, '- User:', user ? `✅ ${user.email}` : '❌ Not authenticated');
  }

  // Allow API routes (webhooks, auth callbacks, etc.)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  // Redirect authenticated users from landing to dashboard
  if (user && request.nextUrl.pathname === '/') {
    if (count % 3 === 1) console.log('[MIDDLEWARE] Redirecting authenticated user from / to /dashboard');
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    if (count % 3 === 1) console.log('[MIDDLEWARE] ⛔ Blocking unauthenticated access to /dashboard, redirecting to /login');
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup')
  ) {
    if (count % 3 === 1) console.log('[MIDDLEWARE] Redirecting authenticated user from auth page to /dashboard');
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
  runtime: 'nodejs',
};
