# Token Refresh Failed - Reconnect Required

## Problem

Your Microsoft account authentication has failed with a **401 error** during token refresh. This means:

❌ The **refresh token** itself is invalid or expired  
❌ Cannot automatically refresh the access token  
❌ Manual reconnection is required

## Why This Happens

Microsoft refresh tokens can become invalid due to:

- **Expiration**: Refresh tokens expire after ~90 days of inactivity
- **Password change**: Changing your Microsoft password revokes all tokens
- **Security settings**: Microsoft security policies can revoke tokens
- **Manual revocation**: Tokens revoked in Microsoft account settings
- **Too many refreshes**: Excessive refresh attempts can trigger revocation

## How to Fix (3 Steps)

### Step 1: Remove Current Account Connection

**Option A: Via UI (Recommended)**

1. Go to email settings
2. Find your Microsoft account (tdaniel@botmakers.ai)
3. Click the kebab menu (⋮)
4. Click "Remove Account"
5. Confirm removal

**Option B: Via SQL (if UI doesn't work)**

```sql
-- This will cascade delete all emails and folders too
DELETE FROM email_accounts
WHERE provider = 'microsoft'
  AND email_address = 'tdaniel@botmakers.ai';
```

### Step 2: Re-add Microsoft Account

1. Go to email settings
2. Click "Add Account" button
3. Select "Microsoft / Outlook"
4. You'll be redirected to Microsoft login
5. Sign in with your Microsoft account
6. **Grant all permissions** when prompted:
   - ✅ Read your mail
   - ✅ Maintain access to data you have given it access to
   - ✅ Sign in and read your profile

### Step 3: Verify and Sync

After reconnecting:

1. You'll be redirected back to the app
2. The account should show as "Connected" (green)
3. A sync will automatically start
4. Wait 25-30 minutes for full sync with content & attachments

## What Changed After Reconnect

The new OAuth flow will provide:

- ✅ Fresh **access_token** (valid for 1 hour)
- ✅ Fresh **refresh_token** (valid for 90 days)
- ✅ Proper token expiration tracking
- ✅ Automatic refresh before expiration

## Why Can't We Auto-Fix This?

Unlike access tokens (which can be refreshed), **refresh tokens** cannot be refreshed:

```
Access Token (1 hour) ──refresh──> New Access Token ✅ Can do automatically
Refresh Token (90 days) ──refresh──> ❌ NOT POSSIBLE - must re-authenticate
```

Once the refresh token is invalid, there's no way to recover without user login.

## Updated Code (Already Applied)

I've updated the error handling to:

1. ✅ Set account `status` to `'error'`
2. ✅ Set `syncStatus` to `'idle'`
3. ✅ Store helpful error message in `lastSyncError`
4. ✅ Show clear instructions in UI

Now when you go to email settings, you'll see:

- 🔴 Red "Error" status indicator
- 📝 Error message: "Authentication failed (401)..."
- 🔧 "Reconnect Account" button in kebab menu

## Preventing This in Future

### Best Practices:

1. **Use the app regularly** (at least once a month)
   - Keeps tokens active and refreshed
2. **Don't change Microsoft password** without reconnecting
   - Or immediately reconnect after password change
3. **Monitor account status** in settings
   - Check for red "Error" indicators
4. **Enable notifications** (when implemented)
   - Get alerted when reconnection needed

### Token Lifecycle:

```
Day 0:   Login ────────────> Fresh tokens
Day 1-89: Auto-refresh ────> Tokens stay valid
Day 90:   Token expires ───> Manual reconnect needed
```

## Quick Command Reference

```powershell
# Check account status
Get-Process -Name node | Select-Object Id, StartTime

# Restart servers if needed
Get-Process -Name node | Stop-Process -Force
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\dev\win-email_client; npm run dev"
Start-Sleep -Seconds 8
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\dev\win-email_client; npx inngest-cli@latest dev --no-discovery -u http://localhost:3000/api/inngest"
```

## Next Steps

1. ✅ **Error handling updated** in code
2. ⏳ **Remove current account** via UI or SQL
3. ⏳ **Re-add Microsoft account** through OAuth flow
4. ⏳ **Wait for sync** to complete (25-30 min)
5. ⏳ **Verify emails** have full content and attachments

---

**Status**: Waiting for manual reconnection  
**Severity**: High (requires user action)  
**ETA**: 2 minutes to reconnect + 30 minutes to sync
