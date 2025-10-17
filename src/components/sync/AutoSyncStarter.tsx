'use client';

/**
 * Auto Sync Starter
 * Automatically starts dual-mode sync for all user accounts on mount
 */

import { useEffect, useState } from 'react';
import { startDualModeSync } from '@/lib/sync/sync-modes';

interface AutoSyncStarterProps {
  accounts: Array<{ id: string; emailAddress: string }>;
}

export function AutoSyncStarter({ accounts }: AutoSyncStarterProps): null {
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (hasStarted || accounts.length === 0) return;

    console.log(`🚀 Auto-starting sync for ${accounts.length} account(s)`);

    // Start sync for all accounts
    accounts.forEach(async (account) => {
      try {
        await startDualModeSync(account.id);
        console.log(`✅ Dual-mode sync started for: ${account.emailAddress}`);
      } catch (error) {
        console.error(
          `Failed to start sync for ${account.emailAddress}:`,
          error
        );
      }
    });

    setHasStarted(true);
  }, [accounts, hasStarted]);

  // This component doesn't render anything
  return null;
}




