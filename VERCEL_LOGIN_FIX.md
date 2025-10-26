# 🐛 Vercel Login Error - Non-ISO-8859-1 Fix

**Date**: October 26, 2025  
**Error**: "Failed to execute 'fetch' on 'Window': Failed to read the 'headers' property from 'RequestInit': String contains non ISO-8859-1 code point." (on login)
**Status**: 🔍 INVESTIGATING

---

## 🔍 Root Cause Analysis

The error occurs **when trying to log in** on the Vercel production deployment. After analyzing the codebase:

### What's NOT the issue:
- ✅ Login/signup code is clean (uses standard Supabase auth)
- ✅ No emojis in actual HTTP headers
- ✅ No custom headers with non-ASCII characters

### Likely Culprits:

1. **Console.log emojis being sent to error tracking**
   - The codebase has MANY console.logs with emojis (🔐, ✅, ❌, 🔄, etc.)
   - If Vercel Analytics or another service tries to send these logs as headers, it will fail

2. **User metadata with special characters**
   - Signup allows `full_name` in metadata
   - If a user enters emojis or special characters in their name, it might be sent in auth headers

3. **Supabase SDK internals**
   - The Supabase client might be adding diagnostic information to headers

---

## ✅ The Fix

### Option 1: Remove Console Log Emojis (Quick Fix)
Replace console.logs with plain text in auth-related files:

**Files to Update:**
- `src/app/(auth)/login/page.tsx` (lines 24, 33, 37, 43)
- `src/app/(auth)/signup/page.tsx`
- `src/middleware.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`

**Before:**
```typescript
console.log('🔐 Login attempt for:', email);
console.error('❌ Login error:', error);
console.log('✅ Login successful:', data.user?.email);
```

**After:**
```typescript
console.log('[AUTH] Login attempt for:', email);
console.error('[AUTH] Login error:', error);
console.log('[AUTH] Login successful:', data.user?.email);
```

### Option 2: Sanitize User Input (Recommended)
Add validation to prevent non-ASCII characters in user metadata:

```typescript
// In signup page
const handleSignup = async (e: React.FormEvent): Promise<void> => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // Sanitize full name - remove any non-ASCII characters
    const sanitizedName = fullName.replace(/[^\x00-\x7F]/g, '');
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: sanitizedName, // Use sanitized name
        },
      },
    });
    // ...
  }
};
```

### Option 3: Disable Console Logs in Production
Add this to `next.config.mjs`:

```javascript
webpack: (config, { isServer, dev }) => {
  if (!dev) {
    // Remove console.logs in production
    config.optimization.minimizer.push(
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove all console statements
          },
        },
      })
    );
  }
  return config;
},
```

---

## 🚀 Immediate Action Required

**Quick Test:**
1. Try logging in with a simple email (no special characters)
2. If it works, the issue is user metadata
3. If it fails, the issue is console.logs

**Quick Fix (Deploy Now):**
Remove emoji console.logs from login page:

```bash
# Apply fixes
git add .
git commit -m "fix: Remove emoji console logs from auth to fix Vercel login"
vercel --prod
```

---

## 🎯 Prevention

1. **Never use emojis in:**
   - HTTP headers
   - Cookie values
   - Console logs that might be sent to error tracking
   - User metadata that might be included in auth tokens

2. **Always sanitize user input:**
   - Strip non-ASCII characters from names
   - Validate email addresses
   - Escape special characters

3. **Use environment-aware logging:**
   ```typescript
   // Only log in development
   if (process.env.NODE_ENV === 'development') {
     console.log('🔐 Login attempt for:', email);
   }
   ```

---

**Next Step**: Remove emoji console.logs from auth files and redeploy.

