import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { testSync } from '@/inngest/functions/test-sync';
import { syncOrchestrator } from '@/inngest/functions/sync-orchestrator'; // NEW: Unified sync orchestrator
import { syncMicrosoftAccount } from '@/inngest/functions/sync-microsoft';
import { syncGmailAccount } from '@/inngest/functions/sync-gmail';
import { syncImapAccount } from '@/inngest/functions/sync-imap';
import { sendScheduledEmails } from '@/inngest/functions/send-scheduled-emails';
// import { proactiveMonitoring } from '@/inngest/functions/proactive-monitoring'; // TEMPORARILY DISABLED - SQL errors

// Admin system background jobs
import { auditLogArchival } from '@/inngest/functions/audit-log-archival';
// import { alertRuleEvaluation } from '@/inngest/functions/alert-rule-evaluation'; // DISABLED - alertRules table not in schema
// import { ticketSlaMonitor } from '@/inngest/functions/ticket-sla-monitor'; // DISABLED - supportTickets table not in schema
import {
  stripeProductSync,
  stripeProductSyncOnDemand,
} from '@/inngest/functions/stripe-product-sync';

/**
 * Inngest API endpoint
 * This handles all Inngest function execution
 * Dashboard: http://localhost:8288
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Email sync functions
    testSync,
    syncOrchestrator, // NEW: Unified sync orchestrator (handles all providers)
    syncMicrosoftAccount, // OLD: Keeping for backward compatibility
    syncGmailAccount, // OLD: Keeping for backward compatibility
    syncImapAccount, // OLD: Keeping for backward compatibility
    sendScheduledEmails, // Scheduled email sender (runs every minute)
    // proactiveMonitoring, // TEMPORARILY DISABLED - SQL errors causing slowdowns

    // Admin system background jobs
    auditLogArchival, // Archive old audit logs (daily at 2 AM)
    // alertRuleEvaluation, // Evaluate alert rules (every minute) - DISABLED: alertRules table missing
    // ticketSlaMonitor, // Monitor ticket SLA (every minute) - DISABLED: supportTickets table missing
    stripeProductSync, // Sync products to Stripe (hourly)
    stripeProductSyncOnDemand, // On-demand product sync (triggered by API)
  ],
});
