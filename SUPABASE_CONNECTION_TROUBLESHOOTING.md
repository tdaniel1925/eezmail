# Supabase Connection Error: "Failed to fetch (api.supabase.com)"

## Error Description

Getting "Failed to fetch (api.supabase.com)" errors when trying to use the application.

---

## Quick Fixes

### 1. Check Internet Connection

```powershell
# Test if you can reach Supabase
ping api.supabase.com
```

### 2. Test Supabase Project Directly

Visit your Supabase dashboard:

- URL: `https://hfduyqvdajtvnsldqmro.supabase.co`
- Dashboard: `https://supabase.com/dashboard/project/hfduyqvdajtvnsldqmro`

If you can't access these, the issue is network-related.

### 3. Check Supabase Status

Visit: https://status.supabase.com/

If there's an outage, you'll need to wait for Supabase to resolve it.

### 4. Clear Browser Cache & Restart Dev Server

```powershell
# Kill the dev server
Get-Process -Name node | Stop-Process -Force

# Clear npm cache
npm cache clean --force

# Restart dev server
npm run dev
```

### 5. Test with cURL

```powershell
curl -I https://hfduyqvdajtvnsldqmro.supabase.co
```

Should return HTTP 200 OK if Supabase is reachable.

---

## Common Causes & Solutions

### Cause 1: Network/Firewall Issue

**Symptoms:**

- Can't reach api.supabase.com
- curl commands timeout
- Browser can't load Supabase dashboard

**Solution:**

1. Check if you're behind a corporate firewall
2. Try disabling VPN temporarily
3. Check Windows Firewall settings
4. Try a different network (mobile hotspot)

### Cause 2: Rate Limiting

**Symptoms:**

- Works initially, then fails
- "Too many requests" in browser console
- Happens during heavy syncing

**Solution:**
Add rate limiting and retry logic (see below for code).

### Cause 3: SSL/TLS Certificate Issue

**Symptoms:**

- "SSL handshake failed"
- "Certificate verification failed"

**Solution:**

```powershell
# Update Node.js certificates
npm config set strict-ssl false  # TEMPORARY ONLY

# Or update Node.js
winget upgrade OpenJS.NodeJS
```

### Cause 4: Supabase Project Paused

**Symptoms:**

- Project was inactive for 7+ days
- Free tier projects get paused

**Solution:**

1. Go to Supabase dashboard
2. Check if project is paused
3. Click "Resume Project" if needed

### Cause 5: Environment Variables Not Loaded

**Symptoms:**

- Error only in production/build
- Works in dev mode

**Solution:**

```powershell
# Verify .env.local is being read
npm run dev

# Check in browser console:
# console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

---

## Enhanced Error Handling (Recommended Implementation)

### Add Retry Logic to Supabase Client

Create a new file: `src/lib/supabase/client-with-retry.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Create Supabase client with retry logic
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);

  // Wrap client methods with retry logic
  return new Proxy(client, {
    get(target, prop) {
      const originalMethod = target[prop as keyof typeof target];

      if (typeof originalMethod === 'function') {
        return async function (...args: any[]) {
          let lastError;

          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
              // @ts-ignore
              return await originalMethod.apply(target, args);
            } catch (error: any) {
              lastError = error;

              // Check if it's a network error
              if (
                error?.message?.includes('fetch') ||
                error?.message?.includes('network') ||
                error?.status === 0
              ) {
                console.warn(
                  `🔄 Supabase request failed (attempt ${attempt}/${MAX_RETRIES}):`,
                  error.message
                );

                if (attempt < MAX_RETRIES) {
                  // Wait before retrying (exponential backoff)
                  await new Promise((resolve) =>
                    setTimeout(resolve, RETRY_DELAY * attempt)
                  );
                  continue;
                }

                // All retries failed
                toast.error(
                  'Connection issue. Please check your internet connection.',
                  { duration: 5000 }
                );
              }

              // Not a network error or last retry - throw immediately
              throw error;
            }
          }

          throw lastError;
        };
      }

      return originalMethod;
    },
  });
}
```

### Add Connection Status Indicator

Create: `src/components/layout/ConnectionStatus.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectionStatus(): JSX.Element {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored', { duration: 3000 });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('No internet connection', { duration: Infinity });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return <></>;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white shadow-lg">
      <WifiOff className="h-5 w-5 animate-pulse" />
      <span className="text-sm font-medium">No Internet Connection</span>
    </div>
  );
}
```

Add to `src/app/dashboard/layout.tsx`:

```typescript
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';

export default async function DashboardLayout({ children }) {
  // ... existing code

  return (
    <ErrorBoundary>
      <ChatbotContextProvider>
        <KeyboardShortcutsProvider>
          <ReplyLaterProvider>
            <div className="flex h-screen overflow-hidden">
              {/* Existing layout */}
            </div>

            {/* Add connection status indicator */}
            <ConnectionStatus />
          </ReplyLaterProvider>
        </KeyboardShortcutsProvider>
      </ChatbotContextProvider>
    </ErrorBoundary>
  );
}
```

---

## Immediate Actions to Try

### Option 1: Test Supabase Connection

```powershell
# Open PowerShell in project directory
cd C:\dev\win-email_client

# Test connection
node -e "fetch('https://hfduyqvdajtvnsldqmro.supabase.co').then(() => console.log('✅ Connected')).catch(err => console.error('❌ Failed:', err.message))"
```

### Option 2: Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for failed requests to `supabase.co`
5. Check the error details

### Option 3: Try Different Browser

Sometimes browser extensions (ad blockers, privacy tools) can block Supabase requests.

### Option 4: Restart Everything

```powershell
# Kill all Node processes
Get-Process -Name node | Stop-Process -Force

# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Restart dev server
npm run dev
```

---

## Prevention: Add Health Check Endpoint

Create: `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'error',
          error: error.message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

Test it: `http://localhost:3000/api/health`

---

## When to Contact Supabase Support

If none of the above works:

1. Check Supabase Status: https://status.supabase.com/
2. Check your project quotas in Supabase dashboard
3. Contact Supabase support with:
   - Project ID: `hfduyqvdajtvnsldqmro`
   - Timestamp of errors
   - Error messages from browser console
   - Your location/region

---

## Current Status

Based on your error "Failed to fetch (api.supabase.com)", the most likely causes are:

1. **Temporary network issue** - Try refreshing the page
2. **Supabase rate limiting** - Too many requests during sync
3. **Firewall/VPN blocking** - Check network settings

**Recommended immediate action:**

1. Refresh the browser (Ctrl+F5)
2. Check if other websites load normally
3. Wait 30 seconds and try again
4. Check Supabase status page

The application should recover automatically once connectivity is restored.


