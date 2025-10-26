# 🐛 Vercel Login ISO-8859-1 Error - DEBUG STEPS

**Error**: "Failed to execute 'fetch' on 'Window': Failed to read the 'headers' property from 'RequestInit': String contains non ISO-8859-1 code point."

**Status**: 🔍 INVESTIGATING - Error persists after initial fixes

---

## 🔍 What We've Tried

### ✅ Already Fixed:

1. Removed emoji console.logs from login page
2. Fixed proactive alerts API crashes
3. Deployed to production

### ❌ Error Still Occurs

---

## 💡 Likely Root Causes

### 1. **Email Subject/Body with Emojis** (Most Likely)

When the dashboard loads after login, it fetches emails. If any email subject or body contains emojis, and that's being sent in a header (instead of body), it will fail.

**Example Problem**:

```typescript
// ❌ BAD - Emoji in header
fetch('/api/email', {
  headers: {
    'X-Email-Subject': '🎉 Welcome!', // FAILS
  },
});

// ✅ GOOD - Emoji in body
fetch('/api/email', {
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    subject: '🎉 Welcome!', // OK
  }),
});
```

### 2. **Supabase SDK Sending Metadata**

The Supabase SDK might be trying to send user metadata or diagnostic info with emojis in request headers.

### 3. **Browser Extension Interference**

A browser extension might be intercepting fetch calls and adding headers with non-ASCII characters.

---

## 🧪 Debug Steps

### Step 1: Check Browser Console

Open https://easemail.ai/login and check the browser console **before** attempting to log in.

Look for:

- Any fetch errors on page load
- Supabase initialization errors
- Network tab → failed requests with emoji characters

### Step 2: Test with Clean Browser

Try logging in using:

- **Incognito/Private mode** (no extensions)
- **Different browser** (Chrome, Firefox, Edge)
- **Clear cache** before attempting

### Step 3: Add Error Boundary

Wrap the login page in an error boundary to catch the exact error:

```typescript
// Add to login page
useEffect(() => {
  const handleFetchError = (event: any) => {
    console.error('[FETCH ERROR]', event);
    if (event.message?.includes('ISO-8859-1')) {
      alert('Detected ISO-8859-1 error! Check console for details.');
    }
  };

  window.addEventListener('unhandledrejection', handleFetchError);
  return () =>
    window.removeEventListener('unhandledrejection', handleFetchError);
}, []);
```

### Step 4: Check Supabase Client

The Supabase client might be sending diagnostic info. Check if there's a custom header being added:

```typescript
// In src/lib/supabase/client.ts
export function createClient() {
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);

  // Check if client is adding custom headers
  console.log('[SUPABASE] Client created:', {
    url: supabaseUrl,
    hasAuth: !!client.auth,
  });

  return client;
}
```

---

## 🎯 Next Steps

1. **Try logging in with browser console open** - capture the exact fetch request that's failing
2. **Check Network tab** - find which request has the non-ASCII header
3. **Look for the exact header name** - is it `Authorization`, `X-Custom-Header`, etc.?
4. **Report back with**:
   - Which request is failing (URL)
   - Which header has the emoji
   - What the header value is

---

## 🔧 Potential Fixes

### Fix 1: Sanitize All User Input

```typescript
function sanitizeForHeader(str: string): string {
  // Remove all non-ASCII characters
  return str.replace(/[^\x00-\x7F]/g, '');
}
```

### Fix 2: Disable Supabase Telemetry

```typescript
// In src/lib/supabase/client.ts
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {}, // Ensure no custom headers with emojis
    },
  });
}
```

### Fix 3: Override Fetch

```typescript
// Global fetch wrapper to sanitize headers
const originalFetch = window.fetch;
window.fetch = function (url, init) {
  if (init?.headers) {
    const sanitizedHeaders = {};
    for (const [key, value] of Object.entries(init.headers)) {
      sanitizedHeaders[key] =
        typeof value === 'string' ? value.replace(/[^\x00-\x7F]/g, '') : value;
    }
    init.headers = sanitizedHeaders;
  }
  return originalFetch(url, init);
};
```

---

## 📝 User Action Required

**Please provide:**

1. Screenshot of browser console error
2. Network tab showing the failed request
3. Which page the error occurs on (login page, dashboard, etc.)
4. Whether it happens immediately on page load or after clicking login

This will help pinpoint the exact source of the error!
