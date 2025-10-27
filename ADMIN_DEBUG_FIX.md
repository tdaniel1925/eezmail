# 🐛 Admin Route Database Query Fix

## Problem

When accessing `/admin/debug/sync-trace` and other debug pages, the application threw a Drizzle ORM error:

```
TypeError: Cannot convert undefined or null to object
    at Object.entries (<anonymous>)
    at orderSelectedFields (drizzle-orm/utils.js:53)
```

**Root Cause:** The query builder was passing `undefined` to the `.where()` clause when no filter conditions were provided.

---

## Issue Details

In `src/lib/debug/sync-tracer.ts`, the following functions were passing `undefined` to Drizzle's `.where()` method:

1. **`getSyncJobs()`** (lines 71-104)
2. **`getSyncJobStats()`** (lines 177-187)

### The Problematic Code Pattern:

```typescript
const conditions = [];
if (status) conditions.push(eq(syncJobs.status, status));
const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

// ❌ This fails when whereClause is undefined
const jobs = await db
  .select({...})
  .from(syncJobs)
  .where(whereClause); // undefined breaks Drizzle ORM
```

Drizzle ORM's internal `orderSelectedFields` function calls `Object.entries()` on the where clause object, which fails when it's `undefined`.

---

## Solution Applied

### Fix 1: `getSyncJobs()` Function

**Before:**

```typescript
const jobs = await db
  .select({...})
  .from(syncJobs)
  .leftJoin(emailAccounts, eq(syncJobs.accountId, emailAccounts.id))
  .where(whereClause) // ❌ undefined breaks this
  .orderBy(desc(syncJobs.createdAt))
  .limit(limit)
  .offset(offset);
```

**After:**

```typescript
const jobsQuery = db
  .select({...})
  .from(syncJobs)
  .leftJoin(emailAccounts, eq(syncJobs.accountId, emailAccounts.id))
  .orderBy(desc(syncJobs.createdAt))
  .limit(limit)
  .offset(offset);

// ✅ Only add where clause if conditions exist
const jobs = whereClause
  ? await jobsQuery.where(whereClause)
  : await jobsQuery;
```

### Fix 2: `getSyncJobStats()` Function

**Before:**

```typescript
const [stats] = await db
  .select({...})
  .from(syncJobs)
  .where(whereClause); // ❌ undefined breaks this
```

**After:**

```typescript
const statsQuery = db
  .select({...})
  .from(syncJobs);

// ✅ Only add where clause if conditions exist
const [stats] = whereClause
  ? await statsQuery.where(whereClause)
  : await statsQuery;
```

---

## What This Fixes

✅ `/admin/debug/sync-trace` - Sync job tracer page now loads without errors  
✅ Any other debug pages using `getSyncJobs()` or `getSyncJobStats()`  
✅ Conditional queries that may have no filter conditions

---

## Testing

1. **Navigate to** `/admin/debug/sync-trace`
2. **Expected Result:** Page loads successfully with sync job statistics
3. **No longer seeing:** `TypeError: Cannot convert undefined or null to object`

---

## Files Modified

- ✅ `src/lib/debug/sync-tracer.ts` - Fixed conditional where clauses

---

## Status: ✅ FIXED

The admin debug pages should now work correctly. The authentication was never the issue - you were properly logged in as admin. The problem was a database query bug triggered when no filter conditions were provided.

**Refresh your browser** to see the fix in action!
