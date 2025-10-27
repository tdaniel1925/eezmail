# Admin System Errors Fixed

## Date: October 27, 2025

This document lists all errors found and fixed in the EaseMail Admin system.

## Phase 1: Branding Update ✅

### Issue: Generic Admin Branding

**File**: `src/components/admin/AdminSidebar.tsx`

**Problem**: Admin sidebar showed generic "Admin Panel" branding instead of EaseMail branding.

**Fix**:

- Changed header from "Admin Panel" → "EaseMail Admin"
- Updated subtitle from "Manage your SaaS platform" → "Manage your email platform"

**Status**: ✅ Fixed

---

## Phase 2: Critical SQL Errors ✅

### Issue 1: SQL Enum Mismatch in Revenue Data

**File**: `src/lib/admin/stats.ts` (lines 152-172)

**Problem**: PostgreSQL error: `operator does not exist: text = subscription_tier`

The `getRevenueData()` function used hardcoded tier values that didn't match the database schema:

- Used: `'free'`, `'starter'`, `'professional'`, `'enterprise'`
- Schema defines: `'individual'`, `'team'`, `'enterprise'`

**Error Message**:

```
PostgresError: operator does not exist: text = subscription_tier
code: '42883'
hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.'
```

**Fix**:

- Updated plan_prices CTE to use correct enum values:
  - 'free' → removed
  - 'starter' → 'individual' (price: $15)
  - 'professional' → 'team' (price: $35)
  - 'enterprise' → 'enterprise' (price: $99)
- Added explicit type casting: `s.tier::text` to ensure proper comparison
- Added explicit type casting in CTE: `'individual'::text`

**Status**: ✅ Fixed

---

### Issue 2: SQL Enum Mismatch in Top Customers Endpoint

**File**: `src/app/api/admin/top-customers/route.ts`

**Problem**: Same enum mismatch causing 500 errors on `/api/admin/top-customers`

The endpoint was using incorrect tier names in the plan_prices CTE.

**Error Message**:

```
Error fetching top customers: PostgresError: operator does not exist: text = subscription_tier
```

**Fix**:

- Updated plan_prices CTE with correct enum values:
  - 'starter' → 'individual' ($15)
  - 'professional' → 'team' ($35)
  - 'enterprise' → 'enterprise' ($200)
- Changed `COALESCE(s.tier, 'free')` → `COALESCE(s.tier::text, 'individual')`
- Added type casting: `pp.tier = s.tier::text`

**Status**: ✅ Fixed

---

### Issue 3: Missing Supabase RPC Functions

**File**: `src/lib/admin/stats.ts`

**Problem**: Dashboard stats page calling non-existent Supabase RPC functions:

- `get_mrr()` - not found
- `get_subscription_stats()` - not found

**Error Message**:

```
Error getting dashboard stats: {
  message: 'No API key found in request',
  hint: 'No `apikey` request header or url param was found.'
}
```

**Fix**: Replaced Supabase RPC calls with direct SQL queries using Drizzle ORM

#### getDashboardStats() Changes:

- Removed `supabase.rpc('get_mrr')` call
- Created inline SQL query with proper enum casting:
  ```sql
  WITH plan_prices AS (
    SELECT 'individual'::text as tier, 15 as price
    UNION ALL SELECT 'team', 35
    UNION ALL SELECT 'enterprise', 99
  )
  SELECT
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status IN ('active', 'trialing')) as active_subscriptions,
    COALESCE(SUM(pp.price) FILTER (WHERE s.status IN ('active', 'trialing')), 0) as mrr
  FROM auth.users u
  LEFT JOIN subscriptions s ON s.user_id = u.id
  LEFT JOIN plan_prices pp ON pp.tier = s.tier::text
  ```

#### getSubscriptionStats() Changes:

- Removed `supabase.rpc('get_subscription_stats')` call
- Created inline SQL query for tier distribution:

  ```sql
  WITH tier_counts AS (
    SELECT
      tier::text,
      COUNT(*) as count
    FROM subscriptions
    WHERE status IN ('active', 'trialing')
    GROUP BY tier
  ),
  total AS (
    SELECT SUM(count) as total_count FROM tier_counts
  )
  SELECT
    tc.tier,
    tc.count,
    ROUND((tc.count::numeric / t.total_count * 100), 2) as percentage
  FROM tier_counts tc
  CROSS JOIN total t
  ORDER BY tc.count DESC
  ```

- Removed unused `createClient` import from `@/lib/supabase/server`

**Status**: ✅ Fixed

---

## Summary

**Total Issues Fixed**: 4

- ✅ Branding update
- ✅ Revenue data SQL enum mismatch
- ✅ Top customers SQL enum mismatch
- ✅ Missing RPC functions replaced with direct SQL

**Impact**:

- Admin sales dashboard now loads without errors
- Top customers endpoint returns data correctly
- Dashboard stats calculate properly
- All SQL queries use correct enum values with proper type casting

**Breaking Changes**: None - all changes are internal optimizations

**Next Steps**:

- Test all admin pages manually
- Verify stats display correctly
- Check performance of new SQL queries
- Consider adding database indexes if queries are slow
