# Inngest Functions Status

## ✅ Active Functions (Deployed)

### Email Sync
- `testSync` - Test email sync functionality
- `syncMicrosoftAccount` - Microsoft/Outlook email sync
- `syncGmailAccount` - Gmail email sync with delta sync
- `syncImapAccount` - IMAP email sync (Yahoo, custom servers)
- `sendScheduledEmails` - Scheduled email sender (runs every minute)

### Admin & Background Jobs
- `auditLogArchival` - Archive old audit logs (daily at 2 AM)
- `stripeProductSync` - Sync products to Stripe (hourly)
- `stripeProductSyncOnDemand` - On-demand product sync (triggered by API)

## ⏸️ Disabled Functions (Not Deployed)

### Missing Schema Tables
These functions are commented out because their database tables don't exist yet:

- `alertRuleEvaluation` - **Requires:** `alert_rules`, `alert_events` tables
- `ticketSlaMonitor` - **Requires:** `support_tickets` table

### SQL Errors
- `proactiveMonitoring` - Has SQL errors, needs debugging

## 📋 To Re-enable Disabled Functions

### 1. Add Missing Tables

Run these migrations (need to be created):
```sql
-- Create alert_rules table
-- Create alert_events table  
-- Create support_tickets table
```

### 2. Update Schema
Add table definitions to `src/db/schema.ts`:
```typescript
export const alertRules = pgTable('alert_rules', { ... });
export const alertEvents = pgTable('alert_events', { ... });
export const supportTickets = pgTable('support_tickets', { ... });
```

### 3. Regenerate Drizzle Types
```bash
npm run db:generate
```

### 4. Uncomment Functions
In `src/app/api/inngest/route.ts`:
```typescript
import { alertRuleEvaluation } from '@/inngest/functions/alert-rule-evaluation';
import { ticketSlaMonitor } from '@/inngest/functions/ticket-sla-monitor';

// Add to functions array:
alertRuleEvaluation,
ticketSlaMonitor,
```

### 5. Deploy
```bash
git push origin glassmorphic-redesign
```

## 🔍 Vercel Build Errors

If you see errors about `alertRuleEvaluation` or `ticketSlaMonitor` during Vercel build:

1. **Clear Inngest Cloud cache:**
   - Go to Inngest Cloud dashboard
   - Remove old function registrations
   - Redeploy

2. **Verify file is committed:**
   ```bash
   git diff src/app/api/inngest/route.ts
   ```
   Should show functions are commented out

3. **Clear Vercel cache:**
   - Go to Vercel dashboard
   - Settings → Clear Build Cache
   - Redeploy

## 📊 Current Deployment Status

**Last Updated:** 2025-10-26
**Branch:** glassmorphic-redesign
**Commit:** 3a1004c

**Functions Count:**
- Active: 8
- Disabled: 3
- Total: 11

