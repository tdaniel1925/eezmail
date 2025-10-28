# 🧪 Manual Testing Checklist - Email Sync System

## Prerequisites
- [x] Inngest running at http://localhost:8288
- [x] .env.local configured with all required keys
- [x] Dev server running: `npm run dev`
- [ ] Database cleaned via Supabase SQL Editor (run migration below)

## Database Reset SQL
Run this in Supabase SQL Editor **BEFORE** testing:

```sql
-- Clean Slate Sync Reset
DELETE FROM emails;

UPDATE email_accounts SET
  status = 'active',
  sync_status = 'idle',
  sync_progress = 0,
  sync_total = 0,
  initial_sync_completed = false,
  sync_cursor = NULL,
  last_sync_at = NULL,
  last_successful_sync_at = NULL,
  last_sync_error = NULL,
  error_count = 0,
  consecutive_errors = 0;

UPDATE email_folders SET
  sync_cursor = NULL,
  last_sync_at = NULL;
```

---

## Test 1: Microsoft Account (OAuth)

### Steps:
1. Navigate to `/dashboard/settings`
2. Click "Connect Email Account" → "Microsoft"
3. Complete OAuth flow
4. Verify redirect back to app (not localhost)
5. Check Inngest dashboard: http://localhost:8288
6. Verify sync event appears with `sync/account`
7. Wait for sync to complete (~30 seconds for small inbox)
8. Navigate to `/dashboard/inbox`
9. Verify emails appear

### Expected Results:
- ✅ OAuth completes successfully
- ✅ Sync event appears in Inngest
- ✅ Account status: `syncing` → `active`
- ✅ Emails visible in inbox
- ✅ Folders synced in database

### Success Criteria:
- [ ] No redirect to localhost
- [ ] Inngest event triggered
- [ ] Sync completes without errors
- [ ] Emails displayed correctly
- [ ] Console shows:
  ```
  ✅ Sync triggered successfully! Run ID: <id>
  ```

---

## Test 2: Gmail Account (OAuth)

### Steps:
1. Navigate to `/dashboard/settings`
2. Click "Connect Email Account" → "Gmail"
3. Complete OAuth flow
4. Verify redirect back to app
5. Check Inngest dashboard
6. Wait for sync to complete
7. Navigate to `/dashboard/inbox`
8. Verify Gmail emails appear

### Expected Results:
- ✅ OAuth completes successfully
- ✅ Sync event appears in Inngest
- ✅ Account status: `syncing` → `active`
- ✅ Emails visible in inbox
- ✅ Labels synced as folders

### Success Criteria:
- [ ] No redirect to localhost
- [ ] Inngest event triggered
- [ ] Sync completes without errors
- [ ] Gmail labels handled correctly
- [ ] Emails displayed correctly

---

## Test 3: IMAP Account (Yahoo/Custom)

### Steps:
1. Navigate to `/dashboard/settings`
2. Click "Connect Email Account" → "Yahoo" or "Custom IMAP"
3. Enter IMAP credentials:
   - Host: `imap.mail.yahoo.com` (or custom)
   - Port: `993`
   - Username: your@yahoo.com
   - Password: app-specific password
4. Submit form
5. Check Inngest dashboard
6. Wait for sync to complete
7. Verify emails appear

### Expected Results:
- ✅ IMAP connection succeeds
- ✅ Sync event appears in Inngest
- ✅ Account status: `syncing` → `active`
- ✅ Emails visible in inbox

### Success Criteria:
- [ ] IMAP authentication works
- [ ] Inngest event triggered
- [ ] Sync completes without errors
- [ ] Emails displayed correctly

---

## Test 4: Multiple Accounts (Parallel Sync)

### Steps:
1. Connect both Microsoft AND Gmail accounts
2. Check Inngest dashboard
3. Verify both accounts sync independently
4. Navigate to `/dashboard/inbox`
5. Verify emails from both accounts visible
6. Use account filter to switch between accounts

### Expected Results:
- ✅ Both accounts sync simultaneously (up to 5 concurrent per Inngest config)
- ✅ No conflicts between syncs
- ✅ Emails from both accounts visible
- ✅ Filter works correctly

### Success Criteria:
- [ ] Concurrent syncs work
- [ ] No data leakage between accounts
- [ ] Emails properly segregated by account

---

## Test 5: Stuck Sync Recovery

### Steps:
1. Connect an account and let it start syncing
2. Kill Inngest manually: `Ctrl+C` in terminal
3. Wait 10 minutes
4. Reload dashboard: `/dashboard`
5. Verify health check runs automatically
6. Check console for: `Reset X stuck sync(s)`

### Expected Results:
- ✅ Health check runs on dashboard load
- ✅ Stuck sync detected and reset to `idle`
- ✅ Account can be manually re-synced

### Success Criteria:
- [ ] Stuck sync detected
- [ ] Account reset to idle
- [ ] No permanent lock-up

---

## Test 6: Token Refresh

### Steps:
1. Connect a Microsoft account
2. Wait for sync to complete
3. Manually expire the token in database:
   ```sql
   UPDATE email_accounts
   SET token_expires_at = NOW() - INTERVAL '1 hour'
   WHERE provider = 'microsoft'
   LIMIT 1;
   ```
4. Trigger manual sync from settings
5. Check Inngest logs for token refresh
6. Verify sync continues after refresh

### Expected Results:
- ✅ Token expiry detected
- ✅ Automatic token refresh triggered
- ✅ Sync continues without user intervention

### Success Criteria:
- [ ] Token refresh automatic
- [ ] No user action required
- [ ] Sync completes successfully

---

## Test 7: Error Handling

### Steps:
1. Connect account with INVALID credentials
2. Verify error message displayed
3. Check Inngest for error classification
4. Verify account status set to `error`
5. Verify user gets actionable error message

### Expected Results:
- ✅ Error detected and classified
- ✅ User-friendly error message shown
- ✅ Account marked as `error`
- ✅ Inngest retries stopped (non-retryable error)

### Success Criteria:
- [ ] Error properly classified
- [ ] User sees helpful message
- [ ] No infinite retry loop

---

## Test 8: Incremental Sync

### Steps:
1. Connect account and wait for initial sync
2. Send yourself a NEW email (via another device/webmail)
3. Wait 5 minutes (for scheduled sync)
4. Refresh inbox
5. Verify new email appears

### Expected Results:
- ✅ New email detected by delta sync
- ✅ Only new emails fetched (not full re-sync)
- ✅ Cursor properly updated in database

### Success Criteria:
- [ ] New email appears
- [ ] Sync cursor saved
- [ ] No duplicate emails

---

## Test 9: Disconnect and Reconnect

### Steps:
1. Disconnect a synced account
2. Verify emails remain in database
3. Reconnect the same account
4. Verify incremental sync continues from cursor
5. No duplicate emails created

### Expected Results:
- ✅ Emails retained on disconnect
- ✅ Reconnect continues from cursor
- ✅ No duplicates

### Success Criteria:
- [ ] Graceful disconnect
- [ ] Clean reconnect
- [ ] No data loss

---

## Test 10: Large Inbox (Pagination)

### Steps:
1. Connect account with >1000 emails
2. Monitor Inngest for pagination
3. Verify all pages synced
4. Check database for email count

### Expected Results:
- ✅ Pagination works correctly
- ✅ All emails synced
- ✅ No memory issues

### Success Criteria:
- [ ] Handles large inboxes
- [ ] Pagination works
- [ ] Performance acceptable

---

## Final Checklist

- [ ] All 10 tests passed
- [ ] No console errors
- [ ] Inngest dashboard clean
- [ ] Database queries efficient
- [ ] UI responsive
- [ ] No memory leaks
- [ ] Error handling comprehensive

---

## Known Issues

(Document any issues found during testing here)

- Issue 1: ...
- Issue 2: ...

---

## Next Steps

Once all tests pass:
1. Run `npm run build` to verify production build
2. Deploy to Vercel staging environment
3. Test on live site with real accounts
4. Monitor for 24 hours
5. Deploy to production

