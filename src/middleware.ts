import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit } from '@/lib/rate-limit';

// Track redirect loops
const redirectCount = new Map<string, number>();

export async function middleware(request: NextRequest) {
  // Skip middleware for Inngest webhooks in development to improve performance
  if (
    process.env.NODE_ENV === 'development' &&
    request.nextUrl.pathname.startsWith('/api/inngest')
  ) {
    return NextResponse.next();
  }

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

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip =
      request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const identifier = user ? `user:${user.id}` : `ip:${ip}`;

    // Different limits for different route types
    let limit = 100; // default: 100 req/min

    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
      limit = 10; // auth endpoints: 10 req/min
    } else if (request.nextUrl.pathname.startsWith('/api/ai/')) {
      limit = 30; // AI endpoints: 30 req/min
    } else if (request.nextUrl.pathname.startsWith('/api/webhooks/')) {
      limit = 200; // webhooks: 200 req/min (payment processors)
    }

    const { success, remaining, reset } = await checkRateLimit(
      identifier,
      limit
    );

    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    supabaseResponse.headers.set('X-RateLimit-Limit', limit.toString());
    supabaseResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    supabaseResponse.headers.set('X-RateLimit-Reset', reset.toString());
  }

  // Debug logging disabled for performance - enable only when debugging
  const enableDebugLogging = false;

  if (
    enableDebugLogging &&
    (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname === '/login')
  ) {
    const allCookies = request.cookies.getAll();
    const supabaseCookies = allCookies.filter(
      (c) => c.name.includes('supabase') || c.name.includes('sb-')
    );
    console.log('[MIDDLEWARE] Path:', request.nextUrl.pathname);
    console.log('[MIDDLEWARE] Total cookies:', allCookies.length);
    console.log(
      '[MIDDLEWARE] Supabase cookies:',
      supabaseCookies.map((c) => c.name).join(', ') || 'NONE'
    );
    console.log(
      '[MIDDLEWARE] User:',
      user ? `✅ ${user.email}` : '❌ Not authenticated'
    );
  }

  // Detect redirect loops
  const clientId = request.headers.get('user-agent') || 'unknown';
  const loopKey = `${clientId}-${request.nextUrl.pathname}`;
  const count = (redirectCount.get(loopKey) || 0) + 1;
  redirectCount.set(loopKey, count);

  // Clear old entries after 10 seconds
  setTimeout(() => redirectCount.delete(loopKey), 10000);

  if (count > 5) {
    // Only log actual redirect loops (critical errors)
    console.error(
      '[MIDDLEWARE] ⚠️ REDIRECT LOOP DETECTED!',
      request.nextUrl.pathname,
      'Count:',
      count
    );
    // Break the loop by allowing the request through
    return supabaseResponse;
  }

  // REMOVED: Verbose "every 3rd request" logging for performance

  // Allow API routes (webhooks, auth callbacks, etc.)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  // Redirect authenticated users from landing to dashboard
  if (user && request.nextUrl.pathname === '/') {
    if (count % 3 === 1)
      console.log(
        '[MIDDLEWARE] Redirecting authenticated user from / to /dashboard'
      );
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    if (count % 3 === 1)
      console.log(
        '[MIDDLEWARE] ⛔ Blocking unauthenticated access to /dashboard, redirecting to /login'
      );
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
    if (count % 3 === 1)
      console.log(
        '[MIDDLEWARE] Redirecting authenticated user from auth page to /dashboard'
      );
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
