# Sent Folder Sync - Quick Reference

## ✅ What's Done

- **Microsoft/Outlook:** Syncs sent folder with delta sync
- **Gmail:** Already working (label-based)
- **IMAP:** Syncs sent folder (tries multiple folder names)
- **UI:** Sent page at `/dashboard/sent`
- **API:** `/api/email/sent` endpoint

---

## 🚀 Quick Start

### 1. Apply Migration

```sql
-- Run in Supabase SQL Editor
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS sent_sync_cursor TEXT;
```

### 2. Sync Your Account

```bash
# Navigate to settings
http://localhost:3000/dashboard/settings?tab=email-accounts

# Trigger manual sync
# Or wait for auto-sync
```

### 3. View Sent Emails

```bash
# Click "Sent" in sidebar
http://localhost:3000/dashboard/sent
```

---

## 📁 Provider Support

| Provider           | Status      | Method      |
| ------------------ | ----------- | ----------- |
| Microsoft/Outlook  | ✅ Complete | Delta Sync  |
| Gmail              | ✅ Complete | Label Sync  |
| IMAP (Yahoo, etc.) | ✅ Complete | Folder Sync |

---

## 🔧 Troubleshooting

### Sent folder empty?

1. Check sync logs in terminal
2. Verify folder names in database:
   ```sql
   SELECT DISTINCT folder_name FROM emails;
   ```
3. Trigger manual sync from settings

### IMAP folder not found?

Add custom folder name to `sentFolderNames` array in:
`src/lib/sync/email-sync-service.ts` line 1184

---

## 📝 Files Changed

- `src/lib/sync/email-sync-service.ts` - Sync logic
- `src/db/schema.ts` - Added sentSyncCursor
- `src/app/dashboard/sent/page.tsx` - Sent page
- `src/app/api/email/sent/route.ts` - API endpoint
- `migrations/20251022000000_add_sent_sync_cursor.sql` - Migration

---

## 🎯 Status

**Production Ready ✅**

All providers work, UI complete, fully tested.

---

_For detailed docs, see: SENT_FOLDER_SYNCING_COMPLETE.md_

