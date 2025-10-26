# Supabase Domain Configuration Fix

## Issue
Login hangs on `easemail.app` domain - likely because Supabase redirect URLs are not configured for the custom domain.

## Required Supabase Configuration

### 1. Go to Supabase Dashboard
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration

### 2. Add the following URLs to "Redirect URLs":

**Production Domain:**
```
https://easemail.app/api/auth/callback
https://www.easemail.app/api/auth/callback
```

**Vercel Deployment URLs (for testing):**
```
https://*.vercel.app/api/auth/callback
```

**Local Development:**
```
http://localhost:3000/api/auth/callback
```

### 3. Update "Site URL" to:
```
https://easemail.app
```

### 4. Verify Environment Variables in Vercel

Make sure these are set in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Testing

After updating Supabase settings:
1. Wait 1-2 minutes for changes to propagate
2. Clear browser cookies for `easemail.app`
3. Try logging in again
4. Check browser console for detailed logs:
   - `[AUTH] Login attempt for: ...`
   - `[AUTH] Login successful: ...`
   - `[AUTH] Session: present`
   - `[AUTH] Redirecting to dashboard...`

## Debugging

If login still hangs, check console logs:
- If you see "Session: missing" → Supabase redirect URLs not configured
- If you see "Login error" → Check credentials or email confirmation
- If page refreshes infinitely → Middleware auth check failing (cookie issue)

## Alternative: Disable Custom Domain Temporarily

If you need to test immediately, use the Vercel deployment URL instead:
```
https://win-emailclient-[deployment-id]-bot-makers.vercel.app
```

The Vercel wildcard pattern should already work for these URLs.

