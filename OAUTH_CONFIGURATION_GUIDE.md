# OAuth Configuration & Troubleshooting Guide

## 🔴 Problem: OAuth Redirects to Landing Page Instead of Dashboard

### Root Causes:

1. **Redirect URL mismatch** in Supabase
2. **Session not being set** properly
3. **Middleware not recognizing** the authenticated session

---

## ✅ Solution: Configure Supabase OAuth Settings

### Step 1: Check Supabase OAuth Configuration

Go to Supabase Dashboard → Authentication → URL Configuration:

**Site URL:** `https://your-domain.vercel.app`

**Redirect URLs (Add all these):**

```
https://your-domain.vercel.app/auth/callback
https://your-domain.vercel.app/dashboard
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
```

### Step 2: Configure Google OAuth Provider

Supabase → Authentication → Providers → Google:

1. **Enabled**: ✅ Yes
2. **Client ID**: Your Google OAuth Client ID
3. **Client Secret**: Your Google OAuth Client Secret
4. **Authorized redirect URIs** (in Google Cloud Console):
   ```
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   https://your-domain.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

### Step 3: Configure Microsoft OAuth Provider

Supabase → Authentication → Providers → Azure (Microsoft):

1. **Enabled**: ✅ Yes
2. **Client ID**: Your Azure App Client ID
3. **Client Secret**: Your Azure App Client Secret
4. **Redirect URIs** (in Azure Portal):
   ```
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   https://your-domain.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

---

## 🔐 OAuth Account Creation Behavior

### How OAuth Creates Accounts:

**Scenario 1: Email Doesn't Exist**

```
User signs in with Google/MS
  ↓
Supabase creates NEW account
  ↓
User redirected to /dashboard
  ↓
User needs to complete onboarding
```

**Scenario 2: Email Already Exists**

```
User signs in with Google/MS
  ↓
Supabase links to EXISTING account
  ↓
User redirected to /dashboard
  ↓
User sees their existing data
```

### Important Notes:

1. ✅ **Same Email = Same Account**
   - If user@gmail.com signs up with email/password
   - Then signs in with Google OAuth
   - They access the **SAME** account

2. ⚠️ **Different Emails = Different Accounts**
   - If user signs up as user@gmail.com
   - Then signs in with MS OAuth as user@company.com
   - These are **TWO SEPARATE** accounts

3. 🔒 **OAuth Users Don't Need Passwords**
   - Accounts created via OAuth don't have passwords
   - They can only sign in via OAuth provider
   - To add password later, use "Forgot Password" flow

---

## 🛠️ Debugging OAuth Issues

### Check Vercel Logs:

```bash
vercel logs [your-deployment-url]
```

Look for:

- `[OAuth Callback]` messages
- `[MIDDLEWARE]` auth checks
- Any error messages

### Common Issues:

#### Issue: "Redirects to landing page"

**Cause**: Session not being set
**Fix**:

1. Check callback URL in Supabase matches exactly
2. Ensure cookies are being set (check browser DevTools → Application → Cookies)
3. Verify middleware is allowing the redirect

#### Issue: "User not authenticated after OAuth"

**Cause**: Cookie domain mismatch
**Fix**: Check that your Supabase project's domain matches your app domain

#### Issue: "OAuth loop - keeps redirecting"

**Cause**: Middleware detecting redirect loop
**Fix**: Clear cookies and try again, or check middleware logs

---

## 🎯 Quick Test

To test if OAuth is working:

1. Open your production site in **Incognito mode**
2. Click "Sign in with Google/Microsoft"
3. Complete OAuth flow
4. **Expected**: Redirect to `/dashboard`
5. **If redirects to `/`**: Check the fixes above

---

## 📝 User Provisioning for OAuth

Currently, your OAuth callback creates a basic user. To ensure proper provisioning:

### File: `src/app/auth/callback/route.ts`

Add user provisioning after successful OAuth:

```typescript
if (data.user) {
  // Ensure user exists in public.users table
  const { db } = await import('@/lib/db');
  const { users } = await import('@/db/schema');

  await db
    .insert(users)
    .values({
      id: data.user.id,
      email: data.user.email!,
      fullName:
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        data.user.email!.split('@')[0],
      roleHierarchy: 'user', // Default role
    })
    .onConflictDoNothing(); // Skip if user already exists
}
```

---

## ✅ Complete OAuth Setup Checklist

- [ ] Supabase Site URL configured
- [ ] Redirect URLs added to Supabase
- [ ] Google OAuth enabled in Supabase
- [ ] Google Cloud Console redirect URIs match
- [ ] Microsoft OAuth enabled in Supabase
- [ ] Azure Portal redirect URIs match
- [ ] Tested in production (incognito mode)
- [ ] User provisioning working
- [ ] Onboarding flow triggers for new OAuth users

---

**Next Steps**: Check your Supabase configuration and update the redirect URLs!
