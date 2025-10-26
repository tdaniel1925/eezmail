import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { testSync } from '@/inngest/functions/test-sync';
import { syncMicrosoftAccount } from '@/inngest/functions/sync-microsoft';
import { sendScheduledEmails } from '@/inngest/functions/send-scheduled-emails';
// import { proactiveMonitoring } from '@/inngest/functions/proactive-monitoring'; // TEMPORARILY DISABLED - SQL errors

/**
 * Inngest API endpoint
 * This handles all Inngest function execution
 * Dashboard: http://localhost:8288
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    testSync,
    syncMicrosoftAccount, // Microsoft email sync
    sendScheduledEmails, // Scheduled email sender (runs every minute)
    // proactiveMonitoring, // TEMPORARILY DISABLED - SQL errors causing slowdowns
    // More functions will be added here as we build them
  ],
});
