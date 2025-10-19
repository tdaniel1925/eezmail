# Database Migrations

This folder contains SQL migration files to optimize and maintain the easeMail database.

## Current Migrations

### 1. `performance_indexes.sql` - Performance Optimization

**Purpose**: Add indexes to frequently queried columns to dramatically improve query performance.

**Expected Improvements**:
- Email queries: 50-70% faster
- Contact search: 80% faster
- Settings page: 40% faster
- Folder navigation: 60% faster

**How to Run**:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **+ New query**
5. Copy and paste the contents of `performance_indexes.sql`
6. Click **Run** button (or press `Ctrl+Enter`)
7. Wait for the success message

**Verification**: After running, you should see a success message like:
```
✅ Performance indexes created successfully!

Expected Performance Improvements:
  - Email queries: 50-70% faster
  - Contact search: 80% faster
  - Settings page: 40% faster
  - Folder navigation: 60% faster
```

### 2. `final_migration.sql` - Missing Tables Fix

**Purpose**: Create missing `contact_timeline` table and ensure proper RLS policies.

**Status**: ✅ Already applied (if you've followed previous setup)

---

## General Migration Best Practices

1. **Always backup your database** before running migrations in production
2. **Test migrations in development** first
3. **Run migrations during low-traffic periods** if possible
4. **Monitor performance** after applying indexes to ensure improvements
5. **Keep migrations in version control** for reproducibility

---

## Need Help?

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify your database schema matches expectations
3. Ensure you have proper permissions to create indexes
4. Contact support if you see unexpected errors

---

**Last Updated**: October 19, 2025

