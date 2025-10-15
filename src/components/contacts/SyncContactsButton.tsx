/**
 * Sync Contacts Button
 * Trigger manual contact sync from email providers
 */

'use client';

import { useState } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { syncContactsFromNylas } from '@/lib/nylas/contacts';

interface SyncContactsButtonProps {
  userId: string;
  grantId: string | null; // Nylas grant ID from connected email account
  lastSyncAt?: Date | null;
  onSyncComplete?: () => void;
}

export function SyncContactsButton({
  userId,
  grantId,
  lastSyncAt,
  onSyncComplete,
}: SyncContactsButtonProps): JSX.Element {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'syncing' | 'success' | 'error'
  >('idle');

  const handleSync = async () => {
    if (!grantId) {
      toast.error(
        'No email account connected. Please connect an email account first.'
      );
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      const result = await syncContactsFromNylas(userId, grantId);

      if (result.success) {
        setSyncStatus('success');
        toast.success(
          `Synced ${result.contactsSynced} contacts! ${result.contactsCreated} new, ${result.contactsUpdated} updated.`
        );
        onSyncComplete?.();

        // Reset success state after 3 seconds
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        toast.error(result.error || 'Failed to sync contacts');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch {
      setSyncStatus('error');
      toast.error('An unexpected error occurred while syncing contacts');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const getButtonClasses = () => {
    const base =
      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200';

    if (syncStatus === 'success') {
      return `${base} bg-green-600 text-white`;
    }

    if (syncStatus === 'error') {
      return `${base} bg-red-600 text-white`;
    }

    if (isSyncing) {
      return `${base} bg-gray-400 text-white cursor-not-allowed`;
    }

    return `${base} bg-primary text-white hover:bg-primary-600 shadow-md hover:shadow-lg`;
  };

  const getIcon = () => {
    if (syncStatus === 'success') {
      return <Check size={18} />;
    }

    if (syncStatus === 'error') {
      return <AlertCircle size={18} />;
    }

    return <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />;
  };

  const getButtonText = () => {
    if (syncStatus === 'success') return 'Synced!';
    if (syncStatus === 'error') return 'Sync Failed';
    if (isSyncing) return 'Syncing...';
    return 'Sync Contacts';
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSync}
        disabled={isSyncing || !grantId}
        className={getButtonClasses()}
        title={
          !grantId
            ? 'Connect an email account to sync contacts'
            : 'Sync contacts from your email provider'
        }
      >
        {getIcon()}
        <span>{getButtonText()}</span>
      </button>

      {lastSyncAt && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Last synced: {new Date(lastSyncAt).toLocaleString()}
        </p>
      )}

      {!grantId && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Connect an email account to enable sync
        </p>
      )}
    </div>
  );
}
