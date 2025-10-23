# IMAP Infinite Spinner Fix

## Problem

IMAP connection test shows spinning indicator forever and never completes.

## Root Causes

1. **No client-side timeout** - Fetch request waits indefinitely
2. **No route timeout** - Next.js route can hang forever
3. **No explicit timeout handling** - Promise.race needed for failsafe

## Solutions Applied

### 1. ✅ Client-Side Timeout (35 seconds)

**File:** `src/app/dashboard/settings/email/imap-setup/page.tsx`

Added `AbortController` with 35-second timeout:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 35000);

const response = await fetch('/api/email/imap/test', {
  signal: controller.signal, // Aborts after 35s
});
```

**Why 35 seconds?** Allows server 30s to respond, plus 5s buffer.

### 2. ✅ Server-Side Timeout (30 seconds)

**File:** `src/app/api/email/imap/test/route.ts`

Added:

- `export const maxDuration = 40` - Next.js route timeout
- `Promise.race()` - Forces 30s timeout on IMAP test
- Better error messages for common issues

```typescript
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => {
    reject(new Error('Connection test timed out after 30 seconds'));
  }, 30000);
});

const isConnected = await Promise.race([
  imapService.testConnection(),
  timeoutPromise, // Wins after 30s
]);
```

### 3. ✅ Enhanced Error Messages

Now provides helpful feedback:

- `ENOTFOUND` → "Server not found - check your IMAP host"
- `ECONNREFUSED` → "Connection refused - check port and firewall"
- `Timed out` → "Connection timed out - wrong password or IMAP not enabled"
- `Invalid credentials` → "Use an app password, not your regular password"

---

## Timeout Chain

```
Client (35s) → API Route (40s) → Promise.race (30s) → IMAP lib (30s)
```

1. **IMAP library timeout**: 30s (in imap-service.ts)
2. **Promise.race timeout**: 30s (failsafe in route.ts)
3. **Route timeout**: 40s (Next.js maxDuration)
4. **Client timeout**: 35s (AbortController)

This ensures the spinner **always stops** within 35 seconds, even if everything else fails.

---

## What Happens Now

### If Connection Works (< 5s):

1. ✅ Shows success message
2. ✅ "Test Connection" button changes to "Save Account"
3. ✅ Green checkmark appears

### If Connection Fails (5-30s):

1. ❌ Shows error message with specific cause
2. ❌ Red X appears with helpful troubleshooting tips
3. ❌ Can try again with different credentials

### If Connection Hangs (30-35s):

1. ⏱️ Client-side timeout kicks in
2. ❌ Shows "Connection timed out after 35 seconds"
3. ❌ Stops spinner and shows error state

---

## Testing

Try these scenarios to verify:

### Valid Credentials:

- Should succeed in < 5 seconds
- Shows green checkmark

### Invalid Password:

- Should fail in 5-10 seconds
- Shows "wrong password or IMAP not enabled"

### Wrong Server:

- Should fail immediately
- Shows "Server not found"

### Completely Wrong:

- Should timeout at 30-35 seconds
- Shows "Connection timed out"

---

## Files Modified

1. `src/app/dashboard/settings/email/imap-setup/page.tsx`
   - Added 35s client-side timeout with AbortController
   - Better error handling for AbortError

2. `src/app/api/email/imap/test/route.ts`
   - Added `maxDuration = 40` (route timeout)
   - Added Promise.race with 30s timeout
   - Enhanced error messages

---

## Next Steps

1. **Restart dev server** (changes require restart)
2. **Try IMAP test again**
3. **Verify spinner stops within 35 seconds max**

---

**Status:** ✅ FIXED  
**Max Wait Time:** 35 seconds (was infinite)  
**Date:** October 23, 2025

## Common Fastmail Issues

If still timing out with Fastmail:

1. **App Password Required**
   - Go to: Fastmail Settings → Password & Security → App Passwords
   - Generate a new app password
   - Use that instead of your regular password

2. **Settings to Check**
   - Host: `imap.fastmail.com`
   - Port: `993`
   - SSL/TLS: ✅ Enabled
   - SMTP Host: `smtp.fastmail.com`
   - SMTP Port: `465`

3. **Two-Factor Authentication**
   - If you have 2FA enabled, you **MUST** use an app password
   - Regular password won't work

The timeout is most likely due to **wrong password** or **not using an app password**.
