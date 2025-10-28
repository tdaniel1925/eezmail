# 🛡️ Production-Ready Email Sync System

## ✅ What Makes This System Reliable

This email sync system has been hardened to prevent the 4 critical issues that were fixed:

1. **Database Connection Resilience** - Auto-detects Supabase and enables SSL
2. **Function Export Completeness** - Both `triggerSync` and `syncAccount` are exported
3. **Complete Folder Sync** - Pagination + recursion syncs ALL folders (100+)
4. **Accurate Folder Display** - Exact type matching shows all folders in UI

---

## 🚀 Quick Start for Production

### Before EVERY Deployment

```bash
# 1. Validate everything
npm run pre-deploy

# 2. If validation passes, deploy
git push origin main
# or
vercel --prod

# 3. Monitor for 15 minutes
# Watch: Vercel logs, Inngest dashboard, /api/health/detailed
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoints

**Simple Health Check:**

```
GET /api/sync/health
```

Response:

```json
{
  "healthy": true,
  "stats": {
    "total": 5,
    "syncing": 1,
    "idle": 4,
    "error": 0,
    "active": 5
  }
}
```

**Detailed Health Check** (recommended for monitoring):

```
GET /api/health/detailed
```

Response:

```json
{
  "healthy": true,
  "status": "operational",
  "duration": 45,
  "checks": {
    "database": { "status": "pass", "duration": 12 },
    "syncOrchestrator": { "status": "pass", "message": "All syncs healthy" },
    "folderSync": { "status": "pass", "message": "166 folders synced" },
    "emailSync": { "status": "pass", "message": "1247 emails synced" },
    "environment": { "status": "pass" },
    "sslConfiguration": {
      "status": "pass",
      "message": "SSL auto-detected for Supabase"
    }
  }
}
```

### Set Up Monitoring

**1. Uptime Monitor** (Pingdom, UptimeRobot, etc.)

- URL: `https://yourdomain.com/api/health/detailed`
- Interval: Every 5 minutes
- Alert if down for >2 consecutive checks

**2. Sync Performance**

```sql
-- Run this query every 15 minutes
SELECT COUNT(*)
FROM email_accounts
WHERE sync_status = 'syncing'
  AND updated_at < NOW() - INTERVAL '20 minutes';
-- Alert if result > 0
```

**3. Error Tracking**

- Install Sentry: `npm install @sentry/nextjs`
- Configure in `sentry.client.config.ts`

---

## 🧪 Testing

### Manual Testing Checklist

See [MANUAL_TESTING_CHECKLIST.md](./MANUAL_TESTING_CHECKLIST.md)

### Automated Testing

```bash
# Run integration tests
npm run test:integration

# Validate deployment readiness
npm run validate

# Full pre-deployment check
npm run pre-deploy
```

---

## 🔧 Troubleshooting Production Issues

### Issue: Sync not working

**Diagnosis:**

```bash
# 1. Check health
curl https://yourdomain.com/api/health/detailed

# 2. Check Inngest
# Go to inngest.com dashboard, look for failed functions

# 3. Check database
# Go to Supabase, check email_accounts table for status = 'error'
```

**Common Fixes:**

- OAuth token expired → User needs to reconnect account
- Rate limit hit → Automatic backoff, wait 5 minutes
- Network timeout → Automatic retry

### Issue: Folders missing

**Check:**

1. Database: How many folders in `email_folders` table?
2. Provider: Does Microsoft API return >10 folders?
3. UI: Are folders being filtered out?

**Run this query:**

```sql
SELECT
  account_id,
  COUNT(*) as folder_count
FROM email_folders
GROUP BY account_id;
```

If count is low (<20), run another full sync.

### Issue: Emails not syncing

**Diagnosis:**

```bash
# Check sync status
curl https://yourdomain.com/api/sync/health

# Look for accounts stuck in 'syncing'
# Health check will auto-reset after 10 minutes
```

---

## 📈 Performance Expectations

### Sync Times

| Mailbox Size  | Initial Sync | Incremental Sync |
| ------------- | ------------ | ---------------- |
| 100 emails    | 30-60 sec    | 5-10 sec         |
| 1,000 emails  | 2-5 min      | 10-30 sec        |
| 10,000 emails | 15-30 min    | 1-2 min          |

### Folder Limits

- **Microsoft**: 500+ folders supported with pagination
- **Gmail**: All labels (typically <100)
- **IMAP**: All folders (varies by provider)

---

## 🔐 Security Checklist

- [ ] All OAuth secrets stored in environment variables (never in code)
- [ ] Database uses SSL (auto-enabled for Supabase)
- [ ] Row Level Security (RLS) enabled in Supabase
- [ ] Webhook signatures verified (if using webhooks)
- [ ] Access tokens encrypted at rest
- [ ] Refresh tokens encrypted at rest
- [ ] Rate limiting enabled on sync endpoints

---

## 🆘 Emergency Contacts

### Service Status Pages

- Vercel: https://vercel-status.com
- Supabase: https://status.supabase.com
- Inngest: https://status.inngest.com
- Microsoft Graph: https://status.cloud.microsoft/
- Google APIs: https://status.cloud.google.com/

### Rollback Procedure

```bash
# 1. Immediate rollback
vercel rollback

# 2. Or rollback to specific deployment
vercel rollback [deployment-url]

# 3. Verify rollback worked
curl https://yourdomain.com/api/health/detailed
```

---

## 📝 Daily Operations

### Morning Check (2 minutes)

1. Check health endpoint
2. Review overnight Inngest runs
3. Check for stuck syncs in database
4. Review error logs

### Weekly Review (15 minutes)

1. Sync success rate (target: >95%)
2. Average sync time trends
3. Folder sync completeness
4. Error patterns
5. User-reported issues

### Monthly Audit (30 minutes)

1. OAuth app status (Microsoft + Google)
2. Database performance
3. Sync infrastructure costs
4. Feature requests from sync issues

---

## 🎯 Success Metrics

Track these KPIs:

- **Sync Success Rate**: >95%
- **P99 Sync Time**: <5 minutes (for 1000 emails)
- **Uptime**: >99.9%
- **Folder Sync Completeness**: 100%
- **Zero-downtime deployments**: 100%

---

## 📚 Related Documentation

- [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Pre-deployment checklist
- [MANUAL_TESTING_CHECKLIST.md](./MANUAL_TESTING_CHECKLIST.md) - Manual testing guide
- [SYNC_SYSTEM.md](./SYNC_SYSTEM.md) - Technical architecture
- [IMPLEMENTATION_SUCCESS.md](./IMPLEMENTATION_SUCCESS.md) - What was built

---

## 🔄 Continuous Improvement

### Logging Best Practices

Already implemented:

```typescript
console.log('🚀 Sync started:', { accountId, provider });
console.log('✅ Folders synced:', folderCount);
console.log('❌ Sync failed:', error.message);
```

### Automated Alerts

Set up alerts for:

- Health check fails 3 times in a row
- Sync stuck for >20 minutes
- Error rate >10/minute
- Database connection issues

---

**Last Updated:** $(date +%Y-%m-%d)  
**System Version:** 2.0 (Production-Ready)  
**Maintained By:** Development Team
