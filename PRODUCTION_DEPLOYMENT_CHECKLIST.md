# 🚀 Production Deployment Checklist

**Use this checklist EVERY TIME before deploying to production.**

---

## Pre-Deployment (30 minutes before deploy)

### 1. Code Validation

- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] Run `npm run lint` - No linting errors
- [ ] Run `npm run build` - Build succeeds
- [ ] Run `node validate-deployment.js` - All checks pass

### 2. Environment Variables (Vercel/Production)

- [ ] `DATABASE_URL` is set with Supabase connection string
- [ ] `NEXT_PUBLIC_SUPABASE_URL` matches your Supabase project
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is correct
- [ ] `MICROSOFT_CLIENT_ID` is set
- [ ] `MICROSOFT_CLIENT_SECRET` is set
- [ ] `GOOGLE_CLIENT_ID` is set
- [ ] `GOOGLE_CLIENT_SECRET` is set
- [ ] `NEXT_PUBLIC_APP_URL` is set to production URL (e.g., `https://easemail.app`)
- [ ] `INNGEST_EVENT_KEY` or `INNGEST_SIGNING_KEY` is set

### 3. OAuth Configuration

- [ ] **Microsoft Azure**: Redirect URI includes `https://yourdomain.com/api/auth/microsoft/callback`
- [ ] **Google Cloud**: Redirect URI includes `https://yourdomain.com/api/auth/google/callback`
- [ ] OAuth apps are set to "Production" mode (not sandbox)

### 4. Database

- [ ] Supabase project is on a paid plan (if needed for production traffic)
- [ ] Row Level Security (RLS) is enabled
- [ ] Database backups are configured
- [ ] Connection pooling is enabled

### 5. Testing (on staging/preview)

- [ ] Test Microsoft account connection
- [ ] Test Gmail account connection
- [ ] Verify all folders sync (check for 100+ folders if available)
- [ ] Verify emails sync successfully
- [ ] Check health endpoint: `/api/health/detailed`
- [ ] Test stuck sync recovery (wait 10 minutes, check reset)

---

## During Deployment

### 1. Deploy

```bash
git push origin main
# or
vercel --prod
```

### 2. Monitor Deployment

- [ ] Vercel build succeeds
- [ ] No build errors in logs
- [ ] Functions deploy successfully
- [ ] Environment variables load correctly

---

## Post-Deployment (15 minutes after deploy)

### 1. Health Checks

- [ ] Visit `https://yourdomain.com/api/health/detailed`
- [ ] All checks show `"status": "pass"`
- [ ] Response time < 2 seconds

### 2. Smoke Tests

- [ ] Can access login page
- [ ] Can log in with test account
- [ ] Dashboard loads without errors
- [ ] Can connect email account (Microsoft or Gmail)
- [ ] Email sync triggers successfully
- [ ] Folders appear in sidebar (verify count)
- [ ] Emails appear in inbox

### 3. Monitor for 30 Minutes

- [ ] Check Vercel logs for errors
- [ ] Check Inngest dashboard for failed functions
- [ ] Monitor Supabase logs for database errors
- [ ] Check Sentry (if configured) for client errors

### 4. Set Up Monitoring

- [ ] Add health check to uptime monitor (Pingdom, UptimeRobot, etc.)
  - URL: `https://yourdomain.com/api/health/detailed`
  - Check interval: Every 5 minutes
  - Alert if down for >2 checks

---

## Known Issues to Watch For

### ❌ Issue 1: "triggerSync is not a function"

**Symptom:** Client emails fail to sync  
**Root Cause:** Missing function export  
**Prevention:** Checked by `validate-deployment.js`  
**Fix:** Verify `src/lib/sync/sync-orchestrator.ts` exports both `triggerSync` and `syncAccount`

### ❌ Issue 2: Only 10 folders syncing instead of 100+

**Symptom:** Clients complain about missing folders  
**Root Cause:** No pagination in Microsoft provider  
**Prevention:** Checked by `validate-deployment.js`  
**Fix:** Verify `src/lib/sync/providers/microsoft.ts` has `fetchFoldersRecursive` with `$top` parameter

### ❌ Issue 3: Database connection timeout

**Symptom:** Health check fails, emails don't sync  
**Root Cause:** SSL not enabled for Supabase  
**Prevention:** Checked by `validate-deployment.js`  
**Fix:** Verify `src/lib/db/index.ts` auto-detects Supabase and enables SSL

### ❌ Issue 4: Folders not showing in sidebar

**Symptom:** Database has folders, but sidebar only shows 10  
**Root Cause:** Over-aggressive filtering  
**Prevention:** Checked by `validate-deployment.js`  
**Fix:** Verify `src/components/sidebar/FolderList.tsx` uses exact type matching, not name matching

---

## Rollback Plan

If deployment fails:

1. **Immediate Rollback:**

   ```bash
   vercel rollback
   ```

2. **Investigate:**
   - Check Vercel logs
   - Check Inngest logs
   - Check Supabase logs
   - Check `/api/health/detailed` response

3. **Fix and Redeploy:**
   - Fix the issue in code
   - Run `node validate-deployment.js`
   - Test on preview deployment first
   - Deploy to production when fixed

---

## Emergency Contacts

- **Vercel Status:** https://vercel-status.com
- **Supabase Status:** https://status.supabase.com
- **Inngest Status:** https://status.inngest.com

---

## Automated Monitoring

### Set Up These Monitors:

1. **Health Check Monitor**
   - URL: `https://yourdomain.com/api/health/detailed`
   - Interval: 5 minutes
   - Alert: If down for >10 minutes

2. **Sync Performance Monitor**
   - Check: Database query for stuck syncs
   - Interval: 15 minutes
   - Alert: If >5 accounts stuck in "syncing" for >20 minutes

3. **Error Rate Monitor**
   - Tool: Sentry or similar
   - Alert: If >10 errors/minute

---

## Success Metrics

After deployment, these should be true:

- ✅ Health check: 200 OK
- ✅ Sync success rate: >95%
- ✅ Folder sync: 100+ folders per account (if available)
- ✅ Email sync: All inbox emails within 2 minutes
- ✅ Zero critical errors in 24 hours

---

**Remember:** Run `node validate-deployment.js` before EVERY production deployment!
