# 🔧 Fixed: Microsoft Sync 401 Authentication Error

## Problem

The Microsoft email sync was failing with:

```
Error: Failed to fetch folders: 401
```

This is an **authentication error** - the access token being used to call Microsoft Graph API was either expired or invalid.

## Root Causes

### 1. Token Not Being Refreshed Proactively ❌

The old logic only checked if the token was **already expired**, not if it was **about to expire**:

```typescript
// OLD CODE - Only refreshes if ALREADY expired
if (!expiresAt || expiresAt <= now) {
  // Refresh token
}
```

**Problem:** By the time we check the token and make the API call, it could expire in between!

### 2. Poor Error Messages ❌

When the 401 error occurred, there was no clear indication of:

- What went wrong
- Whether it was a token issue
- What the user should do

### 3. No Error Handling for Token Refresh Failures ❌

If the refresh token itself was invalid, the sync would just fail without updating the account status or giving clear guidance.

## Solution Applied

### 1. Proactive Token Refresh (5-Minute Buffer) ✅

```typescript
// NEW CODE - Refreshes 5 minutes BEFORE expiry
const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

if (!expiresAt || expiresAt <= fiveMinutesFromNow) {
  console.log('🔄 Token expired or expiring soon, refreshing...');
  // Refresh token
}
```

**Benefit:** Tokens are refreshed proactively before they expire, preventing mid-sync failures.

### 2. Enhanced Error Messages ✅

```typescript
if (response.status === 401) {
  throw new Error(
    'Authentication failed (401). The access token may be invalid. ' +
      'Please try removing and re-adding your Microsoft account.'
  );
}
```

Terminal logs now show:

- `🔍 Token check: expires at ...`
- `🔄 Token expired or expiring soon, refreshing...`
- `✅ Token refreshed successfully`
- `❌ Token refresh failed: <details>`

### 3. Account Status Updates on Auth Errors ✅

```typescript
catch (error) {
  await db.update(emailAccounts).set({
    syncStatus: 'idle',
    status: error.message.includes('401') ? 'error' : 'active',
    lastSyncError: error.message,
  });
  throw error;
}
```

**Benefit:** If auth fails, the account is marked as `error` status so the UI can show a "Reconnect" button.

### 4. Validation of Refresh Token ✅

```typescript
if (!account.refreshToken) {
  throw new Error('No refresh token available. Please reconnect your account.');
}
```

## Files Modified

1. **`src/inngest/functions/sync-microsoft.ts`**
   - Lines 54-117: Improved token refresh logic
   - Lines 119-151: Enhanced folder fetch error handling
   - Lines 289-305: Added try-catch for error handling

## How to Test

### Step 1: Check Current Token Status

Run this SQL in your database:

```sql
-- Check all Microsoft accounts
SELECT
  email_address,
  token_expires_at,
  CASE
    WHEN token_expires_at < NOW() THEN '❌ EXPIRED'
    WHEN token_expires_at < NOW() + INTERVAL '5 minutes' THEN '⚠️ Expiring soon'
    ELSE '✅ Valid'
  END as token_status,
  access_token IS NOT NULL as has_access_token,
  refresh_token IS NOT NULL as has_refresh_token
FROM email_accounts
WHERE provider = 'microsoft';
```

**OR** use the provided script: `CHECK_TOKEN_STATUS.sql`

### Step 2: Trigger a Sync

1. Go to **Settings → Email Accounts**
2. Click **"Sync Now"** on your Microsoft account
3. **Watch the terminal logs**

### Expected Results

#### If Token Was Expired:

```
🚀 Microsoft sync started
✅ Validated account: your-email@example.com
🔍 Token check: expires at 2025-10-24T10:30:00.000Z, now is 2025-10-24T11:00:00.000Z
🔄 Token expired or expiring soon, refreshing...
✅ Token refreshed successfully
   New token expires: 2025-10-24T12:00:00.000Z
📁 Fetching folders from Microsoft Graph...
📊 Found 8 folders
✅ Syncing emails from "inbox"
...
🎉 Microsoft sync complete!
```

#### If Refresh Token is Invalid:

```
🚀 Microsoft sync started
✅ Validated account: your-email@example.com
🔍 Token check: expires at 2025-10-24T10:00:00.000Z
🔄 Token expired or expiring soon, refreshing...
❌ Token refresh failed: 400 {"error": "invalid_grant"}
❌ Microsoft sync failed: Token refresh failed: 400. Please reconnect your account.
```

**Action Required:** Remove and re-add the Microsoft account in Settings.

## Troubleshooting

### If You Still Get 401 Errors:

#### Option 1: Force Token Expiry (Test Refresh)

```sql
-- Make token appear expired to force refresh
UPDATE email_accounts
SET token_expires_at = NOW() - INTERVAL '1 hour'
WHERE provider = 'microsoft'
  AND email_address = 'your-email@example.com'; -- Replace with your email
```

Then trigger sync and watch logs.

#### Option 2: Remove & Re-add Account (Fresh Tokens)

1. Settings → Email Accounts
2. Click "Remove Account"
3. Click "Add Account" → Microsoft
4. Complete OAuth flow
5. New tokens will be generated

#### Option 3: Check Environment Variables

Ensure these are set in `.env.local`:

```
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
```

## Key Improvements

| Before                    | After                                     |
| ------------------------- | ----------------------------------------- |
| Refreshed only if expired | Refreshes 5 minutes before expiry         |
| Generic "401" error       | Clear message: "Please reconnect account" |
| No error handling         | Try-catch with account status updates     |
| No token validation       | Checks for missing refresh token          |
| Minimal logging           | Detailed token lifecycle logging          |

## Success Criteria

✅ Token is refreshed automatically before expiry  
✅ Sync completes without 401 errors  
✅ Clear error messages if auth fails  
✅ Account status updated to "error" if reconnection needed  
✅ Detailed logs for troubleshooting

## Prevention

The new logic ensures:

- **Tokens never expire mid-sync** (5-minute buffer)
- **Clear guidance** if user action is needed
- **Account status reflects auth state** (error vs. active)
- **Automatic retries** via Inngest (up to 3 times)

---

**Status:** 🟢 AUTH ERROR HANDLING FIXED

Test the sync now and watch the terminal for improved logging! 🚀

If you still see 401 errors after refresh, it means the refresh token itself is invalid and you'll need to reconnect the account (Option 2 above).
