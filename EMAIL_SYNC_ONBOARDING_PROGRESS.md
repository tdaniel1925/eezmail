# Email Sync & Onboarding Fix - Implementation Progress

**Date**: January 27, 2025  
**Status**: Phase 1-2 Complete | Phase 3-4 In Progress

---

## ✅ COMPLETED (Phase 1 & 2)

### Phase 1: Fix Sent Email Categorization

**1. Database Schema Updated**

- ✅ Added `'sent'` to `emailCategoryEnum` in `src/db/schema.ts`
- ✅ Created migration `drizzle/0011_add_sent_category.sql`

**2. Sync Logic Fixed**

- ✅ Updated `categorizeFolderName()` in `src/inngest/functions/sync-microsoft.ts`
  - Changed line 34: `return 'sent'` instead of `return 'inbox'`
- ✅ Added account validation to Microsoft sync (early exit if account deleted)

**Note**: Gmail and IMAP syncs don't use categorizeFolderName - they use folder mapper which already handles sent correctly.

### Phase 2: Implement Tiered Folder Selection

**1. Smart Defaults Service Created**

- ✅ `src/lib/folders/smart-defaults.ts`
  - `applySmartDefaults()` - Auto-configures standard folders
  - `detectFolderCount()` - Gets folder count
  - `getEnabledFolders()` - Lists enabled folders

**2. Cleanup Service Created**

- ✅ `src/lib/folders/cleanup.ts`
  - `cleanupOrphanedFolders(userId)` - Removes orphaned folders for user
  - `cleanupAllOrphanedFolders()` - Admin cleanup function

**3. API Routes Created**

- ✅ `src/app/api/email/accounts/count/route.ts`
  - GET/POST endpoints to get user's email account count
- ✅ `src/app/api/folders/smart-defaults/route.ts`
  - POST endpoint to apply smart folder defaults

**4. Folder Confirmation Component Enhanced**

- ✅ `src/components/onboarding/FolderConfirmation.tsx`
  - Added `isOptional` and `isRequired` props
  - Added `handleUseSmartDefaults()` function
  - Added smart defaults UI card (shown when `isOptional=true`)

**5. Folder Selection Page Created**

- ✅ `src/app/dashboard/onboarding/folders/page.tsx`
  - Parses URL params (accountId, required, optional)
  - Renders FolderConfirmation with appropriate flags

**6. Microsoft OAuth Callback Updated**

- ✅ `src/app/api/auth/microsoft/callback/route.ts`
  - Removed immediate sync trigger
  - Added account counting logic
  - Implements tiered redirection:
    - 1st account → `/dashboard/onboarding/folders?accountId=X&required=true`
    - 2nd-3rd account → `/dashboard/onboarding/folders?accountId=X&optional=true`
    - 4+ accounts → Auto-applies smart defaults, redirects to inbox
  - Calls `cleanupOrphanedFolders()` before redirecting

### Phase 2.5: Onboarding State Tracking

**1. Database Schema Updated**

- ✅ Added fields to `onboardingProgress` table:
  - `onboardingStep` - Current step in flow
  - `foldersConfigured` - Boolean flag
  - `lastCheckpoint` - Timestamp
- ✅ Created migration `drizzle/0012_onboarding_resume.sql`

**2. Onboarding Actions Enhanced**

- ✅ `src/lib/onboarding/actions.ts`
  - Added `advanceOnboardingStep()` function
  - State machine logic for step progression
  - Sets appropriate flags based on completed step

---

## 🚧 REMAINING TASKS (Phase 3 & 4)

### Phase 3: Complete Onboarding Resume Flow

**Still TODO:**

1. ❌ Create `OnboardingResumeBanner.tsx` component
2. ❌ Add banner to dashboard layout
3. ❌ Update Google OAuth callback (if exists)
4. ❌ Update IMAP setup page redirect logic

### Phase 4: Fix Orphaned Sync Jobs

**Still TODO:**

1. ❌ Add validation to Gmail sync function
2. ❌ Add validation to IMAP sync function
3. ❌ Create cleanup script `scripts/cleanup-orphaned-syncs.ts`

### Testing & Deployment

**Still TODO:**

1. ❌ Run migrations in Supabase (0011, 0012)
2. ❌ Test sent email categorization
3. ❌ Test folder selection workflow (1st, 2nd-3rd, 4+ accounts)
4. ❌ Test onboarding resume banner
5. ❌ Run cleanup script to cancel orphaned jobs

---

## 📋 FILES CREATED (11 new files)

1. `drizzle/0011_add_sent_category.sql` - Migration for sent category
2. `drizzle/0012_onboarding_resume.sql` - Migration for onboarding state
3. `src/lib/folders/smart-defaults.ts` - Smart defaults service
4. `src/lib/folders/cleanup.ts` - Cleanup service
5. `src/app/api/email/accounts/count/route.ts` - Account count API
6. `src/app/api/folders/smart-defaults/route.ts` - Smart defaults API
7. `src/app/dashboard/onboarding/folders/page.tsx` - Folder selection page

**Still to create:** 8. `src/components/onboarding/OnboardingResumeBanner.tsx` 9. `scripts/cleanup-orphaned-syncs.ts`

---

## 📝 FILES MODIFIED (5 files)

1. ✅ `src/db/schema.ts` - Added 'sent' enum value + onboarding fields
2. ✅ `src/inngest/functions/sync-microsoft.ts` - Fixed categorization + validation
3. ✅ `src/app/api/auth/microsoft/callback/route.ts` - Tiered folder selection
4. ✅ `src/components/onboarding/FolderConfirmation.tsx` - Optional mode support
5. ✅ `src/lib/onboarding/actions.ts` - State machine logic

**Still to modify:** 6. ❌ `src/inngest/functions/sync-gmail.ts` - Add validation 7. ❌ `src/inngest/functions/sync-imap.ts` - Add validation 8. ❌ `src/app/dashboard/settings/email/imap-setup/page.tsx` - Tiered redirection 9. ❌ `src/app/dashboard/layout.tsx` - Add resume banner

---

## 🎯 NEXT STEPS

1. **Complete Gmail/IMAP validation** - Add account existence checks
2. **Create resume banner** - Build OnboardingResumeBanner component
3. **Update IMAP setup** - Add tiered folder selection logic
4. **Run migrations** - Execute SQL in Supabase
5. **Test thoroughly** - Verify all three issues are fixed

---

## 📊 PROGRESS: 65% Complete

**Breakdown:**

- Phase 1 (Sent Categorization): 100% ✅
- Phase 2 (Folder Selection): 90% ✅ (MS OAuth done, need IMAP + Gmail if exists)
- Phase 3 (Onboarding Resume): 50% 🚧 (schema done, need UI)
- Phase 4 (Orphaned Jobs): 33% 🚧 (MS done, need Gmail + IMAP + script)

---

## ⚠️ IMPORTANT NOTES

1. **No Nylas** - This app uses Microsoft Graph API, Google Gmail API, and IMAP (NOT Nylas)
2. **Microsoft Sync** - Already has proper sent email categorization fix
3. **Gmail/IMAP** - Use folder mapper, don't have categorizeFolderName
4. **Migrations Pending** - Both SQL migrations need to be run in Supabase before testing

---

## 🔍 KEY DECISIONS MADE

1. **Folder Selection Enforcement**: Tiered by account count (1st=required, 2nd-3rd=optional, 4+=auto)
2. **Sent Email Category**: Added 'sent' to enum (most straightforward)
3. **Onboarding Resume**: Dismissible banner (least disruptive)
4. **Orphaned Jobs**: Both validation AND cleanup script (comprehensive fix)

---

_Last Updated: 2025-01-27 - Implementation ongoing_
