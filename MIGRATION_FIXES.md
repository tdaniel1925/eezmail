# Migration Fixes Applied

## Issue 1: Missing user_id Column ✅ FIXED

**Error**: `column emails.user_id does not exist`

**Problem**: The pgvector migration was trying to filter by `emails.user_id`, but the emails table doesn't have that column. The relationship is: `emails` → `account_id` → `email_accounts` → `user_id`.

**Fix Applied**: Modified `migrations/20251018030000_enable_pgvector_rag.sql`

Changed line 42 from:

```sql
where emails.user_id = filter_user_id
```

To:

```sql
inner join email_accounts on emails.account_id = email_accounts.id
where email_accounts.user_id = filter_user_id
```

---

## Issue 2: CREATE INDEX CONCURRENTLY in Transaction ✅ FIXED

**Error**: `CREATE INDEX CONCURRENTLY cannot run inside a transaction block`

**Problem**: Supabase SQL Editor wraps all queries in a transaction block by default, but `CREATE INDEX CONCURRENTLY` cannot run inside transactions.

**Fix Applied**: Modified `migrations/performance_indexes.sql`

Removed all `CONCURRENTLY` keywords from CREATE INDEX statements:

```sql
-- Before:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_category_date ...

-- After:
CREATE INDEX IF NOT EXISTS idx_emails_category_date ...
```

**Note**: This means indexes will be created with table locks (blocking writes), but since this is the first time running the migration, it won't impact users. The indexes will build quickly on initial data.

---

## Issue 3: Missing sender_email Column ✅ FIXED

**Error**: `column "sender_email" does not exist`

**Problem**: The performance index was trying to use `emails.sender_email`, but the actual column is `from_address` (JSONB type storing an EmailAddress object).

**Fix Applied**: Modified `migrations/performance_indexes.sql` line 31-32

Changed from:

```sql
CREATE INDEX IF NOT EXISTS idx_emails_sender
ON emails(account_id, sender_email, received_at DESC)
WHERE is_trashed = FALSE;
```

To:

```sql
CREATE INDEX IF NOT EXISTS idx_emails_sender
ON emails(account_id, ((from_address->>'email')::text), received_at DESC)
WHERE is_trashed = FALSE;
```

**Explanation**: Uses JSONB operator `->>` to extract the `email` field from the `from_address` JSONB column as text.

---

## ✅ Ready to Run

Both migrations are now fixed and ready to run in Supabase SQL Editor:

1. **Run first**: `migrations/20251018030000_enable_pgvector_rag.sql`
   - Enables vector extension
   - Adds embedding column
   - Creates vector index
   - Creates match_emails() function (now with correct JOIN)

2. **Run second**: `migrations/performance_indexes.sql`
   - Creates 11 performance indexes
   - Runs ANALYZE on tables
   - Includes verification queries

Both should complete without errors now! ✅

---

## What Changed

### File 1: `migrations/20251018030000_enable_pgvector_rag.sql`

- Line 41: Added `inner join email_accounts on emails.account_id = email_accounts.id`
- Line 43: Changed `emails.user_id` to `email_accounts.user_id`

### File 2: `migrations/performance_indexes.sql`

- Lines 7, 13, 19, 25, 34, 39, 44, 49, 53, 57: Removed `CONCURRENTLY` keyword
- Line 31-32: Fixed sender index to use JSONB extraction `((from_address->>'email')::text)` instead of non-existent `sender_email` column
- Added note at top explaining why CONCURRENTLY was removed

---

_Fixes applied: October 22, 2025_
_Total fixes: 3 schema mismatches resolved_
