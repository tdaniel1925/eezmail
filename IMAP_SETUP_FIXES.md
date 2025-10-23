# IMAP Setup Fixes

## Issues Fixed

### 1. ✅ Scroll Issue in IMAP Setup Page

**Problem:** Cannot scroll the account setup section in the main column, had to zoom out to access buttons.

**Solution:**

- Changed `min-h-screen` to `h-full overflow-y-auto` for proper scrolling
- Added `pb-24` (bottom padding) to ensure buttons are accessible
- Page now scrolls properly within the dashboard layout

**File:** `src/app/dashboard/settings/email/imap-setup/page.tsx`

---

### 2. ✅ IMAP Connection Timeout

**Problem:** `Timed out while authenticating with server` error when testing Fastmail IMAP connection.

**Root Cause:**

- Default IMAP timeout was too short
- Config interface mismatch (`user` vs `username`, `tls` vs `secure`)

**Solutions:**

1. **Increased timeouts:**
   - `connTimeout`: 30000ms (30 seconds)
   - `authTimeout`: 30000ms (30 seconds)

2. **Fixed config normalization:**
   - Accepts both `username` and `user`
   - Accepts both `tls` and `secure`
   - Properly maps config to IMAP library format

3. **Added helpful error messages:**
   - Shows "Testing connection (this may take up to 30 seconds)..." during test
   - On timeout error, displays possible causes:
     - Wrong password (need app password, not regular password)
     - IMAP not enabled
     - Firewall blocking port
     - Incorrect server settings

**File:** `src/lib/email/imap-service.ts`

---

## Common IMAP Issues & Solutions

### Timeout Errors:

1. **App Password Required**
   - Don't use your regular email password
   - Generate an app-specific password from your provider
   - Fastmail: Settings → Password & Security → App Passwords

2. **IMAP Not Enabled**
   - Gmail: Settings → Forwarding and POP/IMAP → Enable IMAP
   - Outlook: Settings → Mail → Sync email → POP and IMAP
   - Fastmail: Already enabled by default

3. **Firewall Issues**
   - Check if port 993 (IMAP) is blocked
   - Check if port 465 or 587 (SMTP) is blocked
   - Try from different network to rule out firewall

4. **Wrong Server Settings**
   - Fastmail: `imap.fastmail.com:993` (SSL)
   - Gmail: `imap.gmail.com:993` (SSL)
   - Outlook: `outlook.office365.com:993` (SSL)

---

## Testing

To test the IMAP connection:

1. Navigate to Dashboard → Settings → Email Accounts
2. Click "Add Account"
3. Select IMAP provider (or Custom IMAP)
4. Fill in credentials (use app password!)
5. Click "Test Connection"
6. Wait up to 30 seconds
7. Should see success or detailed error message

---

## Files Changed

1. `src/app/dashboard/settings/email/imap-setup/page.tsx`
   - Added scrolling capability
   - Added helpful timeout error messages

2. `src/lib/email/imap-service.ts`
   - Increased connection and auth timeouts to 30 seconds
   - Fixed config interface to accept both old and new formats
   - Normalized config for IMAP library compatibility

---

## Next Steps

If timeout persists:

1. Verify app password is correct
2. Check IMAP is enabled in email provider settings
3. Try from different network
4. Check provider documentation for correct IMAP settings
5. Contact provider support if issue persists

---

**Status:** ✅ FIXED  
**Date:** October 23, 2025

