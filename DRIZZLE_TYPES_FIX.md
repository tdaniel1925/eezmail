# 🔧 Critical Issue: Drizzle Types Need Regeneration

## ⚠️ Problem

The schema has been updated in `src/db/schema.ts` with new fields, but **TypeScript doesn't recognize them** because Drizzle's generated types are out of sync.

### What Happened:

1. ✅ Schema was updated with new columns (`providerId`, `folderId`, `lastSyncCursor`, etc.)
2. ✅ Migration SQL was created (`migrations/019_schema_sync_updates.sql`)
3. ❌ **Drizzle types were NOT regenerated** (this is the problem!)

## 🚨 Current Status

- ✅ Inngest dashboard works (no `internal_server_error`)
- ❌ Gmail sync function is **temporarily disabled**
- ❌ IMAP sync function is **temporarily disabled**
- ❌ Ticket SLA monitor is **temporarily disabled**
- ⚠️ Microsoft sync still works (uses old schema)

## ✅ Solution: 3 Steps

### Step 1: Apply the Migration (CRITICAL!)

Run this SQL in your Supabase SQL Editor:

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `migrations/019_schema_sync_updates.sql`
3. Paste and run it
4. Verify you see: `✅ Migration 019 complete!`

**Without this, the database won't have the new columns!**

### Step 2: Regenerate Drizzle Types

After applying the migration, run:

```bash
npm run db:generate
# OR
npx drizzle-kit generate
```

This will regenerate TypeScript types to match your updated schema.

### Step 3: Re-enable Sync Functions

Once types are regenerated:

1. Open `src/app/api/inngest/route.ts`
2. **Uncomment** these lines:
   ```typescript
   import { syncGmailAccount } from '@/inngest/functions/sync-gmail';
   import { syncImapAccount } from '@/inngest/functions/sync-imap';
   import { ticketSlaMonitor } from '@/inngest/functions/ticket-sla-monitor';
   ```
3. **Uncomment** in the functions array:
   ```typescript
   syncGmailAccount,
   syncImapAccount,
   ticketSlaMonitor,
   ```
4. Restart the dev server

## 🎯 Why This Matters

Without regenerating Drizzle types:

- ❌ TypeScript doesn't know about new columns
- ❌ Insert/update queries fail with "property doesn't exist" errors
- ❌ Gmail and IMAP sync won't work
- ❌ Folder linking won't work
- ❌ Delta sync cursors won't be stored

## 📝 Drizzle Commands

```bash
# Generate migrations (we already did this manually)
npm run db:generate

# Push schema to database (alternative to SQL migration)
npm run db:push

# Open Drizzle Studio (visual database editor)
npm run db:studio
```

## 🔍 Verification

After running all 3 steps, verify:

1. **Check Inngest Dashboard** (http://localhost:8288)
   - ✅ All 3 sync functions should appear
   - ✅ No `internal_server_error` messages

2. **Test Gmail Sync**
   - Connect a Gmail account
   - Go through folder confirmation
   - Verify sent items sync correctly

3. **Check Database**
   - Open Supabase → Table Editor
   - Verify `email_accounts` has: `last_sync_cursor`, `last_synced_at`, `imap_config`
   - Verify `email_folders` has: `provider_id`, `last_synced_at`, `last_sync_cursor`
   - Verify `emails` has: `folder_id`, `provider_id`

## 🎉 Once Complete

After all steps:

- ✅ Gmail sync will work perfectly
- ✅ IMAP sync will work perfectly
- ✅ Sent items will sync to correct folders
- ✅ All folders will be properly detected
- ✅ Delta sync will be efficient (no re-downloading)

---

**TL;DR:** Apply migration → Run `npm run db:generate` → Uncomment sync functions → Restart server
