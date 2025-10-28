# Microsoft OAuth & Email Sync Troubleshooting Guide

## Overview
This document captures critical fixes and best practices for Microsoft account integration, based on real production issues encountered during development.

---

## ✅ CRITICAL FIXES APPLIED (2025-10-28)

### 1. Database Enum Mismatches

#### Problem
Multiple PostgreSQL enum errors during folder sync and email categorization:
- `invalid input value for enum core_folder_type: "junk"` 
- `invalid input value for enum email_category: "newsletter"`
- `invalid input value for enum email_category: "spam"`

#### Root Cause
Code was using enum values that didn't exist in the database schema.

#### Solution
**File: `src/lib/folders/folder-mapper.ts`**
- Changed mapping key from `'junk'` → `'spam'` (line 236)
- The `core_folder_type` enum uses `'spam'`, not `'junk'`

**File: `src/inngest/functions/sync-microsoft.ts`**
- Updated `categorizeFolderName()` to ONLY use valid enum values:
  - `'spam'` → `'junk'` ✅
  - `'archived'` → `'deleted'` ✅
  - `'unscreened'` → `'inbox'` ✅

**File: `src/lib/folders/counts.ts` & `counts-fixed.ts`**
- Disabled `getNewsFeedCount()` - returns `0` until `'newsletter'` is added to enum

**Valid Database Enum Values:**
```typescript
// core_folder_type enum
'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'archive' | 'custom'

// email_category enum  
'inbox' | 'sent' | 'drafts' | 'junk' | 'outbox' | 'deleted'
```

---

### 2. Missing Username Field in OAuth Callback

#### Problem
```
PostgresError: null value in column "username" of relation "users" violates not-null constraint
```

#### Root Cause
Microsoft OAuth callback was inserting users WITHOUT a `username` field, which is `NOT NULL` in the schema.

#### Solution
**File: `src/app/api/auth/microsoft/callback/route.ts`**

Added username generation from email:
```typescript
// Generate username from email (e.g., tdaniel@example.com -> tdaniel)
const usernameFromEmail = email.split('@')[0];

await db
  .insert(users)
  .values({
    id: user.id,
    email: user.email || email,
    username: usernameFromEmail, // ← CRITICAL: Required field
    fullName: user.user_metadata?.full_name || profile.displayName || usernameFromEmail,
  })
  .onConflictDoNothing();
```

**Enhanced Error Logging:**
- Stack traces for better debugging
- Environment variable status checks
- Clearer error messages for token exchange failures

---

### 3. Incomplete Folder Detection (Only 10-17 Folders)

#### Problem
Only fetching 10-17 folders when users have 50+ folders including nested structures.

#### Root Causes
1. **Default API limit**: Microsoft Graph API returns max 10 items by default
2. **No pagination**: Code only made one request
3. **No recursion**: Child folders weren't being fetched

#### Solution
**File: `src/app/api/folders/detect/route.ts`**

Implemented recursive folder fetching with pagination:

```typescript
async function fetchFolderAndChildren(folderId?: string): Promise<any[]> {
  let allFolders: any[] = [];
  
  const baseUrl = folderId 
    ? `/me/mailFolders/${folderId}/childFolders`
    : '/me/mailFolders';
  
  let nextLink = `${baseUrl}?$top=100`; // Request 100 per page
  
  // Pagination loop
  while (nextLink) {
    const response = await client.api(nextLink).get();
    const folders = response.value || [];
    allFolders = allFolders.concat(folders);
    nextLink = response['@odata.nextLink'] || null;
  }
  
  // Recursively fetch children
  for (const folder of allFolders) {
    if (folder.childFolderCount > 0) {
      const children = await fetchFolderAndChildren(folder.id);
      allFolders = allFolders.concat(children);
    }
  }
  
  return allFolders;
}
```

**Result**: Now fetches ALL folders including deeply nested structures (50+ folders).

---

### 4. Database Connection Issues (localhost vs production)

#### Problem
Connection timeouts on localhost: `connect ENETUNREACH` or `CONNECT_TIMEOUT`

#### Root Cause
Using Supabase Session Pooler hostname which may have IPv6/network issues on localhost.

#### Solution
**.env.local** should use **direct connection**:
```env
# LOCALHOST: Use direct connection (more stable)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# PRODUCTION (Vercel/Railway): Use Session Pooler for IPv4 compatibility
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

**File: `src/lib/db/index.ts`**

Optimized for Vercel serverless:
```typescript
const client = postgres(connectionString, {
  max: isServerless ? 1 : 10,
  idle_timeout: isServerless ? 20 : 30,
  connect_timeout: 10,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  prepare: false, // Required for connection pooler
});
```

---

### 5. Foreign Key Constraint Violations

#### Problem
```
insert or update on table "emails" violates foreign key constraint "emails_account_id_email_accounts_id_fk"
Key (account_id)=(...) is not present in table "email_accounts"
```

#### Root Cause
Inngest background sync job continues running even after user removes the account from the UI.

#### Solution
**Always stop/cancel running sync jobs when account is removed:**
1. Cancel Inngest job via API
2. Mark account as `deleted` instead of hard-deleting
3. Add `CASCADE` to foreign key constraints (if appropriate)

**TODO**: Implement proper sync job cancellation in account removal flow.

---

### 6. React.Children.only Error

#### Problem
```
Error: React.Children.only expected to receive a single React element child.
```

#### Root Cause
Button component with `asChild` prop (using Radix UI `Slot`) was receiving multiple children (loading spinner + content).

#### Solution
**File: `src/components/ui/button.tsx`**

```typescript
return (
  <Comp
    ref={ref}
    disabled={disabled || isLoading}
    className={cn(/* ... */)}
    {...props}
  >
    {asChild ? (
      children  // ← Slot receives single child
    ) : (
      <>
        {isLoading && <Spinner />}
        {children}
      </>
    )}
  </Comp>
);
```

---

## 🚀 BEST PRACTICES FOR SMOOTH OAUTH FLOW

### Pre-Deployment Checklist

#### 1. Environment Variables (Vercel/Railway)
```bash
# Microsoft OAuth
MICROSOFT_CLIENT_ID=<from Azure App Registration>
MICROSOFT_CLIENT_SECRET=<from Azure App Registration>  
MICROSOFT_TENANT_ID=common  # or specific tenant ID

# App URL (CRITICAL - must match Azure redirect URI)
NEXT_PUBLIC_APP_URL=https://your-domain.com  # NO trailing slash

# Database (use Session Pooler for IPv4 compatibility)
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# OpenAI (required for AI features, but shouldn't break sync)
OPENAI_API_KEY=sk-...
```

**⚠️ CRITICAL**: When copying credentials from Azure:
- **Manually retype** in Vercel - don't copy/paste (prevents invisible BOM/CRLF characters)
- Verify no extra spaces/newlines
- Test with health check endpoint after deployment

#### 2. Azure App Registration Setup

**Redirect URIs (MUST match exactly):**
```
https://your-domain.com/api/auth/microsoft/callback
http://localhost:3000/api/auth/microsoft/callback
```

**API Permissions:**
- `Mail.Read` (Delegated)
- `Mail.ReadWrite` (Delegated)
- `Mail.Send` (Delegated)
- `User.Read` (Delegated)
- `offline_access` (Delegated)

**Grant admin consent** if required by organization.

#### 3. Database Schema Validation

Before deploying any enum-related code changes:

```sql
-- Verify enum values match code expectations
SELECT enumlabel FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'core_folder_type';

SELECT enumlabel FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'email_category';
```

**If adding new enum values:**
```sql
ALTER TYPE core_folder_type ADD VALUE IF NOT EXISTS 'new_value';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'newsletter';
```

---

### Development Workflow

#### Starting Dev Environment

**Correct order:**
```bash
# 1. Clear cache if code changed significantly
Remove-Item -Path .next -Recurse -Force

# 2. Start Next.js dev server
npm run dev

# 3. Wait 5-10 seconds, then start Inngest
npx inngest-cli@latest dev
```

**⚠️ If ports are occupied:**
```powershell
# Kill all Node processes
Get-Process | Where-Object {$_.ProcessName -match "node|inngest"} | Stop-Process -Force

# Wait 2 seconds, then restart
Start-Sleep -Seconds 2
npm run dev
```

#### Testing OAuth Flow Locally

1. **Verify `.env.local` has correct values**
   ```bash
   cat .env.local | Select-String "MICROSOFT|DATABASE_URL|NEXT_PUBLIC_APP_URL"
   ```

2. **Check health endpoint**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Test OAuth flow**
   - Go to `http://localhost:3000/dashboard/settings?tab=email-accounts`
   - Click "Add Microsoft Account"
   - Should redirect to Microsoft login
   - Should redirect back with account added

4. **Watch terminal logs for errors**
   - Check Next.js terminal for backend errors
   - Check Inngest terminal for sync job errors

---

### Debugging Common Issues

#### Issue: "Account added but showing 0 emails"

**Check:**
1. Is Inngest dev server running?
   ```bash
   # Look for Inngest logs in terminal
   # Should see: "apps synced, disabling auto-discovery"
   ```

2. Are sync jobs executing?
   ```bash
   # Watch for: "🚀 Microsoft sync started"
   ```

3. Database connection working?
   ```bash
   # Look for: "✅ Synced X folders", "📧 Processing batch of X emails"
   # BAD: "CONNECT_TIMEOUT", "ENETUNREACH"
   ```

**Solution:** Check `.env.local` DATABASE_URL, restart servers.

---

#### Issue: "Found 16 folders but I have 50+"

**Root Cause:** Folder detection happened BEFORE recursive fetch code was deployed.

**Solution:**
1. Remove and re-add the Microsoft account
2. This triggers fresh folder detection with new recursive code
3. Should now see all folders including nested ones

**Log to verify:**
```
📁 Found X Microsoft folders (including nested)
```

---

#### Issue: "invalid input value for enum"

**Root Cause:** Code using enum value not in database schema.

**Solution:**
1. Check which enum: `core_folder_type` vs `email_category`
2. Verify valid values in database (see section 1)
3. Update code to use correct enum values
4. Clear `.next` cache and restart

**Quick reference:**
```typescript
// core_folder_type: Use 'spam' (not 'junk')
// email_category: Use 'junk' (not 'spam')
```

---

#### Issue: "foreign key constraint violation"

**Root Cause:** Old sync job still running after account removed.

**Solution:**
1. Kill all processes: `Get-Process node | Stop-Process -Force`
2. Remove orphaned data:
   ```sql
   DELETE FROM emails WHERE account_id NOT IN (SELECT id FROM email_accounts);
   DELETE FROM email_folders WHERE account_id NOT IN (SELECT id FROM email_accounts);
   ```
3. Restart servers and add account again

---

### Production Deployment Checklist

**Before pushing to production:**

- [ ] All environment variables set in Vercel/Railway
- [ ] Azure redirect URIs include production URL
- [ ] Database connection uses Session Pooler hostname
- [ ] No hardcoded `localhost` URLs in code
- [ ] Health check endpoint returns `connected: true`
- [ ] Test OAuth flow on staging first
- [ ] Verify folder detection fetches all folders
- [ ] Confirm email sync jobs complete successfully

**After deployment:**

- [ ] Test full OAuth flow on production URL
- [ ] Verify emails sync within 2-3 minutes
- [ ] Check Vercel logs for errors
- [ ] Monitor Inngest dashboard for failed jobs

---

## 📊 Monitoring & Observability

### Key Endpoints to Monitor

1. **Health Check**: `GET /api/health`
   - Should return `"connected": true`
   - Monitor for database connection issues

2. **Sync Status**: `GET /api/email/sync?accountId={id}`
   - Returns current sync status
   - Monitor for stuck "syncing" states

3. **Folder Count**: Check after OAuth
   - UI should show correct number of folders
   - Log should show `📁 Found X Microsoft folders`

### Critical Logs to Watch

**Success indicators:**
```
✅ Synced X folders
📧 Processing batch of X emails
✅ All pages fetched - Total synced: X
✅ Delta link saved for folder "..." 
```

**Error indicators:**
```
❌ Microsoft sync failed: ...
PostgresError: invalid input value for enum ...
Error: foreign key constraint violation ...
CONNECT_TIMEOUT / ENETUNREACH
```

---

## 🔧 Quick Fixes Reference

| Issue | Quick Fix |
|-------|-----------|
| Enum error | Update code to use valid enum value, restart with cleared cache |
| Username constraint | Ensure OAuth callback generates username from email |
| Only 10-17 folders | Remove & re-add account to trigger recursive fetch |
| 0 emails synced | Ensure Inngest is running, check DATABASE_URL |
| Connection timeout | Switch to direct connection in .env.local |
| Foreign key error | Stop old sync jobs, clean orphaned data |
| React.Children.only | Ensure Slot receives single child when asChild=true |
| Invisible chars in env | Manually retype credentials in Vercel |

---

## 📝 Future Improvements

### High Priority
- [ ] Add sync job cancellation when account is removed
- [ ] Add `'newsletter'` to `email_category` enum
- [ ] Implement soft-delete for email accounts (mark as deleted, don't hard-delete)
- [ ] Add retry logic for transient database errors
- [ ] Better error messages in UI when sync fails

### Medium Priority
- [ ] Add health check cron job to detect stuck syncs
- [ ] Implement sync job status UI (progress bar, estimated time)
- [ ] Add manual "Re-detect Folders" button (without removing account)
- [ ] Log sync job history for debugging
- [ ] Add telemetry/monitoring for production

### Low Priority
- [ ] Support custom folder name overrides
- [ ] Batch email inserts for better performance
- [ ] Add sync job prioritization
- [ ] Implement incremental sync optimization

---

## 🎯 Testing Scenarios

Before marking OAuth integration as complete, test:

1. **Fresh account addition**
   - New user, never connected before
   - Should see all folders
   - Emails should sync within 3 minutes

2. **Account removal and re-addition**
   - Remove account
   - Re-add same account
   - Should re-detect folders
   - Old emails should not duplicate

3. **Multiple accounts**
   - Add 2+ Microsoft accounts
   - Each should sync independently
   - No data leakage between accounts

4. **Edge cases**
   - 0 folders (unlikely but possible)
   - 100+ nested folders
   - Folders with special characters
   - Very large mailboxes (10,000+ emails)

5. **Error recovery**
   - Network timeout during sync
   - Token expiration mid-sync
   - Database connection loss
   - Server restart during sync

---

## 📚 Related Documentation

- `BUILD_SUMMARY.md` - Overall project status
- `SETUP_GUIDE.md` - Initial setup instructions
- `PRD/` folder - Product requirements
- `src/inngest/functions/sync-microsoft.ts` - Email sync implementation
- `src/app/api/folders/detect/route.ts` - Folder detection logic

---

## 🆘 Getting Help

If issues persist after following this guide:

1. Check terminal logs for specific error messages
2. Verify all environment variables are set correctly
3. Test health endpoint to confirm database connectivity
4. Check Inngest logs for background job failures
5. Review Azure App Registration settings

**Common root causes:**
- Environment variables missing or have typos
- Azure redirect URIs don't match exactly
- Database connection string incorrect
- Stale cached code (need to restart with cleared `.next`)
- Background jobs from old session still running

---

*Last updated: 2025-10-28*
*Issues resolved in this session: Enum mismatches, missing username, incomplete folder detection, database connection issues, foreign key violations, React children errors*

