'use client';

/**
 * Auto Sync Starter - DISABLED
 * Old dual-mode sync system replaced by Inngest
 * Sync is now triggered via Inngest events from OAuth callback and manual sync button
 */

interface AutoSyncStarterProps {
  accounts: Array<{ id: string; emailAddress: string }>;
}

export function AutoSyncStarter({ accounts }: AutoSyncStarterProps): null {
  // OLD SYNC SYSTEM DISABLED - Now using Inngest for reliable, durable sync
  // Sync is triggered via:
  // 1. OAuth callback (src/app/api/auth/microsoft/callback/route.ts)
  // 2. Manual sync button (src/lib/settings/email-actions.ts)
  // 3. Inngest scheduler (future)

  console.log(
    `ℹ️  AutoSyncStarter: Old sync system disabled. Using Inngest for ${accounts.length} account(s)`
  );

  // This component doesn't render anything and no longer starts sync
  return null;
}
