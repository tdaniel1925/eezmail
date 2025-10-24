import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { testSync } from '@/inngest/functions/test-sync';
import { syncMicrosoftAccount } from '@/inngest/functions/sync-microsoft';

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
    // More functions will be added here as we build them
  ],
});
