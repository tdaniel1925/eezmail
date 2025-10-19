# Settings Route Fix

## Issue

User encountered 404 errors when clicking certain menu items in the ProfileDropUp component. The links were pointing to non-existent routes like `/dashboard/settings/preferences` and `/dashboard/settings/shortcuts`.

## Root Cause

The ProfileDropUp component had hardcoded incorrect route paths that didn't match the actual settings page architecture. The settings page uses query parameters (`?tab=`) for navigation, not separate route paths.

## Solution

Updated the ProfileDropUp component to use the correct query parameter format for all settings links.

### Changes Made

**File: `src/components/sidebar/ProfileDropUp.tsx`**

| Menu Item          | Old Route                         | New Route                                | Status   |
| ------------------ | --------------------------------- | ---------------------------------------- | -------- |
| Preferences        | `/dashboard/settings/preferences` | `/dashboard/settings?tab=ai-preferences` | ✅ Fixed |
| Keyboard Shortcuts | `/dashboard/settings/shortcuts`   | `/dashboard/settings?tab=help`           | ✅ Fixed |
| Help & Support     | `/dashboard/help`                 | `/dashboard/settings?tab=help`           | ✅ Fixed |
| Manage Storage     | `/dashboard/settings/storage`     | `/dashboard/settings?tab=billing`        | ✅ Fixed |

### Routes That Are Correct

These routes were found but are **already correct** (they have actual page files):

- `/dashboard/settings/billing` ✅ Has page at `src/app/dashboard/settings/billing/page.tsx`
- `/dashboard/settings/email/imap-setup` ✅ Has page at `src/app/dashboard/settings/email/imap-setup/page.tsx`

## Available Settings Tabs

The settings page (`/dashboard/settings`) supports these tabs via query parameters:

1. `?tab=account` - Account settings
2. `?tab=email-accounts` - Connected email accounts
3. `?tab=folders` - Custom folders
4. `?tab=signatures` - Email signatures
5. `?tab=rules` - Email rules and filters
6. `?tab=ai-preferences` - AI configuration
7. `?tab=voice-messages` - Voice settings
8. `?tab=notifications` - Notification preferences
9. `?tab=appearance` - Theme and display
10. `?tab=billing` - Subscription and billing
11. `?tab=security` - Privacy and security
12. `?tab=help` - Help center
13. `?tab=danger-zone` - Data management

## Testing

After the fix:

1. ✅ Click profile dropdown → "Preferences" → Opens AI Preferences tab
2. ✅ Click profile dropdown → "Keyboard Shortcuts" → Opens Help tab
3. ✅ Click profile dropdown → "Help & Support" → Opens Help tab
4. ✅ Click profile dropdown → "Manage Storage" → Opens Billing tab

All links now navigate correctly without 404 errors.

## Files Modified

- `src/components/sidebar/ProfileDropUp.tsx` - Fixed 4 incorrect route paths

---

**Date:** 2025-10-19
**Status:** ✅ Complete
