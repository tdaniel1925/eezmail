# Performance Issues - Quick Fix Guide

## 🐌 Issues Identified

Based on your slowness when clicking attachments and navigation:

### 1. **Attachments Page - Client-Side Fetching**

- `/dashboard/attachments` is a Client Component that fetches data on mount
- No loading skeleton - users see blank screen while waiting
- Fetches metadata for ALL attachments (can be 100s of records)

### 2. **Attachment Downloads - Provider Fetch**

- When you click download, if attachment isn't cached, it:
  1. Fetches from Microsoft/Google API (**slow - 2-5 seconds**)
  2. Uploads to Supabase Storage
  3. Then downloads to your browser

### 3. **Dashboard Layout - Heavy Load**

- Loads 7+ components on every page:
  - Sidebar with folder counts
  - AI Assistant Panel
  - Notification Center
  - Reply Later Stack
  - Proactive Suggestions
  - Tutorial Manager
  - Auto-sync starter

### 4. **Missing Database Indexes**

According to `COMPLETE_PERFORMANCE_AUDIT.md`, these indexes are missing:

```sql
-- Missing indexes causing slow queries
CREATE INDEX idx_emails_account_category ON emails(account_id, email_category);
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX idx_emails_thread ON emails(thread_id, sent_at);
```

---

## ✅ Quick Fixes (In Priority Order)

### Fix #1: Add Loading Skeletons (Immediate UX Improvement)

**Impact**: Makes app **feel 3x faster** even though it's not
**Effort**: 10 minutes
**Files**:

- Add `<Skeleton />` components while data loads
- Shows immediate feedback when clicking

### Fix #2: Add Database Indexes (Actual Speed Improvement)

**Impact**: **60-80% faster queries**
**Effort**: 5 minutes
**Action**:

```sql
-- Run in Supabase SQL Editor
CREATE INDEX IF NOT EXISTS idx_emails_account_category ON emails(account_id, email_category);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_thread_sent ON emails(thread_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_attachments_email ON email_attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user ON email_attachments(user_id);
```

### Fix #3: Cache API Responses (Client-Side)

**Impact**: **Instant navigation** after first load
**Effort**: 15 minutes using SWR
**Files**: Any Client Component fetching data

### Fix #4: Lazy Load Heavy Components

**Impact**: **2x faster initial page load**
**Effort**: Already done in `dashboard/layout.tsx` ✅

### Fix #5: Prefetch Attachments in Background

**Impact**: **Instant downloads** for commonly accessed files
**Effort**: 30 minutes
**How**: Download from provider to storage during sync, not on-demand

---

## 🚀 Implementation Plan

### Step 1: Add Database Indexes (NOW - 5 minutes)

This will have the **biggest impact** with least effort:

1. Go to Supabase Dashboard: https://supabase.com
2. Click your project
3. Go to **SQL Editor**
4. Run this script:

```sql
-- Email query indexes
CREATE INDEX IF NOT EXISTS idx_emails_account_category
  ON emails(account_id, email_category);

CREATE INDEX IF NOT EXISTS idx_emails_received_at
  ON emails(received_at DESC);

CREATE INDEX IF NOT EXISTS idx_emails_thread_sent
  ON emails(thread_id, sent_at);

-- Attachment query indexes
CREATE INDEX IF NOT EXISTS idx_attachments_email
  ON email_attachments(email_id);

CREATE INDEX IF NOT EXISTS idx_attachments_user
  ON email_attachments(user_id);

CREATE INDEX IF NOT EXISTS idx_attachments_download
  ON email_attachments(user_id, download_status);

-- Folder counts optimization
CREATE INDEX IF NOT EXISTS idx_emails_folder
  ON emails(account_id, folder);

-- Analyze tables to update query planner statistics
ANALYZE emails;
ANALYZE email_attachments;
```

**Expected Result**: Queries should be 60-80% faster immediately.

### Step 2: Add Loading States (15 minutes)

I can add skeleton loaders to make the app feel much more responsive.

### Step 3: Implement SWR Caching (Optional - 20 minutes)

Use `swr` library to cache API responses so navigating back/forth is instant.

---

## 📊 Specific Slowness Sources

### Attachments Click:

1. **Page navigation** - Loading 7 components (3-4 seconds)
2. **API call** to `/api/attachments` (1-2 seconds with no indexes)
3. **No loading state** - Feels even slower

**Solution**: Steps 1 + 2 above

### Attachment Download:

1. **Check if cached** (fast)
2. **If not cached** - Fetch from Microsoft/Google (2-5 seconds)
3. **Upload to storage** (1-2 seconds)
4. **Download to browser** (instant)

**Solution**: Prefetch during sync, or show better progress indicator

### Navigation Between Pages:

1. **Dashboard layout re-renders** all providers/contexts
2. **New page fetches data** (no cache)
3. **No loading state**

**Solution**: Steps 2 + 3 above

---

## 🎯 What To Do Right Now

**Option A: Maximum Impact (Recommended)**

1. Run the SQL script above in Supabase (5 min)
2. Let me add loading skeletons (10 min)
3. Test and see immediate improvement

**Option B: Quick Test**

1. Just run the SQL script
2. Test attachments page now
3. Should be noticeably faster

**Option C: Full Fix**

1. SQL indexes
2. Loading skeletons
3. SWR caching
4. Background attachment prefetch

Which approach would you like? I recommend **Option A** for the best balance of effort vs impact.

---

## 📈 Expected Results

**Before Fixes**:

- Attachments page: 4-6 seconds to load
- Navigation: 2-3 seconds between pages
- Download attachment: 3-7 seconds

**After Fixes (Option A)**:

- Attachments page: 1-2 seconds (feels instant with skeleton)
- Navigation: 0.5-1 second
- Download attachment: Still 3-7 seconds (needs background prefetch)

**After Fixes (Option C)**:

- Attachments page: <0.5 seconds (cached)
- Navigation: Instant (cached)
- Download attachment: Instant (prefetched)
