'use client';

import { useEffect, useRef, useState } from 'react';
import { syncEmailAccount } from '@/lib/settings/email-actions';

interface UseAutoSyncOptions {
  accountId: string;
  intervalMs?: number; // Default 3 minutes
  enabled?: boolean; // Default true
  initialSync?: boolean; // Default false - don't sync on mount
}

interface AutoSyncState {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  error: string | null;
  syncCount: number;
}

export function useAutoSync({
  accountId,
  intervalMs = 180000, // 3 minutes (improved performance)
  enabled = true,
  initialSync = false, // Don't sync on mount by default
}: UseAutoSyncOptions) {
  const [state, setState] = useState<AutoSyncState>({
    isSyncing: false,
    lastSyncAt: null,
    error: null,
    syncCount: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const performSync = async () => {
    if (!isActiveRef.current || state.isSyncing) return;

    console.log('🔄 Auto-sync triggered for account:', accountId);

    setState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const result = await syncEmailAccount(accountId);

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncAt: new Date(),
          syncCount: prev.syncCount + 1,
          error: null,
        }));
        console.log('✅ Auto-sync completed successfully');
      } else {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          error: result.error || 'Sync failed',
        }));
        console.error('❌ Auto-sync failed:', result.error);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      console.error('❌ Auto-sync error:', error);
    }
  };

  useEffect(() => {
    if (!enabled || !accountId) return;

    console.log(
      '🚀 Starting auto-sync for account:',
      accountId,
      'interval:',
      intervalMs + 'ms'
    );

    // Perform initial sync only if requested
    if (initialSync) {
      performSync();
    }

    // Set up interval
    intervalRef.current = setInterval(performSync, intervalMs);

    return () => {
      console.log('🛑 Stopping auto-sync for account:', accountId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [accountId, intervalMs, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    triggerSync: performSync,
  };
}
