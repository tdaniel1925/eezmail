# 🚨 CRITICAL: Run This Migration Now

## You must run this SQL in Supabase to complete the performance fix!

### Why This Is Critical:

The performance issues were partially caused by **missing Row Level Security policies** on newly created tables. Without RLS policies, Supabase:

- Denies or slows down queries
- Performs expensive permission checks
- Blocks legitimate user access

### What To Do:

1. **Open Supabase Dashboard**
   - Go to your project
   - Navigate to **SQL Editor**

2. **Run the migration:**
   - Open file: `RESTORE_MISSING_FEATURES_RLS.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run**

3. **Verify Success:**
   You should see this message:

   ```
   ==============================================================
   RLS POLICIES APPLIED SUCCESSFULLY!
   ==============================================================
   Security Improvements:
     ✅ RLS enabled on embedding_queue
     ✅ RLS enabled on contact_timeline_queue
     ✅ RLS enabled on user_ai_profiles

   Performance Improvements:
     ✅ Added composite indexes for queue processing
     ✅ Added indexes for failed item retry

   Security Status:
     ✅ Users can only access their own data
     ✅ All CRUD operations protected
   ==============================================================
   ```

### What This Does:

- Adds RLS policies for 3 new tables
- Adds performance indexes
- Ensures users can only see their own data
- Eliminates permission-related query slowdowns

### After Running:

- Restart your dev server
- Test page load times
- Verify no permission errors in console

**DO THIS BEFORE TESTING!** The other optimizations won't show full effect until RLS is in place.

---

**File:** `RESTORE_MISSING_FEATURES_RLS.sql`  
**Estimated Time:** < 1 minute  
**Risk Level:** Low (creates policies, doesn't modify data)
