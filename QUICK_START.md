# Quick Start Guide - New Admin Systems

## 🚀 Get Started in 3 Steps

### Step 1: Apply Database Migration

```bash
# Apply the advanced analytics migration
psql $DATABASE_URL -f migrations/017_advanced_analytics.sql
```

### Step 2: Navigate to New Admin Features

All systems are ready to use! Visit:

- **Sync Jobs:** [/admin/debug/sync-trace](/admin/debug/sync-trace)
- **Connection Test:** [/admin/debug/connection-test](/admin/debug/connection-test)
- **Performance:** [/admin/debug/profiler](/admin/debug/profiler)
- **GDPR Privacy:** [/admin/privacy](/admin/privacy)
- **Analytics:** [/admin/analytics/advanced](/admin/analytics/advanced)

### Step 3: Add Navigation Links (Optional)

Update your admin sidebar to include links to the new pages.

---

## 📋 What Each System Does

### 🔍 Sync Job Tracer

Track email synchronization jobs in real-time. See which jobs are running, completed, or failed. Click any job for a detailed timeline with performance metrics.

**Best For:** Debugging email sync issues, monitoring sync performance

### 🔌 Connection Tester

Test email provider connections (Gmail, Microsoft). Get a health score (0-100) with actionable recommendations to fix issues.

**Best For:** Diagnosing connectivity problems, validating OAuth tokens

### ⚡ Performance Profiler

Find slow API endpoints and queries. See average response times, P95/P99 percentiles, and error rates.

**Best For:** Identifying performance bottlenecks, optimizing slow queries

### 🛡️ GDPR Privacy Manager

Handle data export and deletion requests. Export all user data to ZIP, manage deletion requests with 30-day grace period.

**Best For:** GDPR compliance, handling data subject requests

### 📊 Advanced Analytics

View cohort retention, churn predictions, revenue attribution, and feature adoption metrics.

**Best For:** Understanding user behavior, identifying churn risks, revenue analysis

---

## 🎯 Common Tasks

### Debug a Failed Sync Job

1. Go to [Sync Job Tracer](/admin/debug/sync-trace)
2. Filter by "Failed" status
3. Click on the failed job
4. Review error message and timeline

### Test Email Connection

1. Go to [Connection Tester](/admin/debug/connection-test)
2. Enter the email account ID
3. Click "Test"
4. Review health score and recommendations

### Export User Data (GDPR)

1. Go to [Privacy Manager](/admin/privacy)
2. View export requests
3. Download completed exports (ZIP files)

### Find Slow Queries

1. Go to [Performance Profiler](/admin/debug/profiler)
2. Check "Slow Queries" section
3. Sort by average duration
4. Optimize the slowest endpoints

### Check Churn Risk

1. Go to [Advanced Analytics](/admin/analytics/advanced)
2. Scroll to "Churn Risk Predictions"
3. View users at high risk
4. Take action to retain them

---

## 🔐 Security Reminder

**Add Admin Role Checks!**

Before deploying to production, add role verification to all API routes:

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();

// Check if user is admin (implement your role system)
if (user.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 📞 Need Help?

- **Logs:** Check `/admin/debug/logs` for recent activity
- **Docs:** See `REMAINING_SYSTEMS_COMPLETE.md` for full details
- **Migration:** Run `migrations/017_advanced_analytics.sql` if analytics don't work

---

**Ready to use!** 🎉
