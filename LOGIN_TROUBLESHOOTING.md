# Login Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Invalid login credentials"
**Cause:** No user account exists in Supabase
**Solution:** Create a test account via signup page or run the test account script

### Issue 2: Page refreshes but stays on login
**Cause:** Session not being saved properly
**Solution:** 
1. Check browser console for errors
2. Clear cookies and try again
3. Verify Supabase keys are correctly set in `.env.local`

### Issue 3: Email confirmation required
**Cause:** Supabase email confirmation is enabled
**Solution:** 
1. Go to Supabase Dashboard > Authentication > Providers > Email
2. Disable "Confirm email" option for development
3. Or check your email for confirmation link

### Issue 4: Redirect loop
**Cause:** Middleware or auth state issue
**Solution:**
1. Clear browser cache and cookies
2. Check browser console for redirect errors
3. Verify middleware.ts is working correctly

## Quick Test

1. Open browser console (F12)
2. Try to login
3. Check for any error messages
4. Check Network tab for failed requests

## Create Test Account Manually

Run this in Supabase SQL Editor:

```sql
-- First, get the user ID from auth.users after signup
-- Then insert into your users table
INSERT INTO users (id, email, role) 
VALUES (
  'YOUR_USER_ID_FROM_AUTH',
  'test@example.com',
  'user'
);
```

## Environment Variables Required

Make sure these are set in `.env.local`:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

