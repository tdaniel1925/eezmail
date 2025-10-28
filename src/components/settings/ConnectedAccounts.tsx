'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  initiateEmailConnection,
  syncEmailAccount,
  removeEmailAccount,
  setDefaultEmailAccount,
  disconnectEmailAccount,
  reconnectEmailAccount,
} from '@/lib/settings/email-actions';
import type { EmailAccount } from '@/db/schema';
import { toast, confirmDialog } from '@/lib/toast';
import { AccountStatusCard } from './AccountStatusCard';
import { SyncControlPanel } from '@/components/sync/SyncControlPanel';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AccountRemovalDialog } from './AccountRemovalDialog';

interface ConnectedAccountsProps {
  accounts: EmailAccount[];
}

export function ConnectedAccounts({
  accounts,
}: ConnectedAccountsProps): JSX.Element {
  console.log('📧 ConnectedAccounts received accounts:', accounts);
  const searchParams = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [removingAccountId, setRemovingAccountId] = useState<string | null>(
    null
  );
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(
    null
  );
  const [accountStats, setAccountStats] = useState<
    Record<string, { emailCount: number; folderCount: number }>
  >({});
  const [bulkSyncMode, setBulkSyncMode] = useState<'parallel' | 'sequential'>(
    'parallel'
  );
  const [bulkSyncProgress, setBulkSyncProgress] = useState<{
    total: number;
    syncing: number;
    completed: number;
  }>({ total: 0, syncing: 0, completed: 0 });
  const [showRemovalDialog, setShowRemovalDialog] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState<{
    id: string;
    email: string;
    emailCount: number;
    folderCount: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  // Show success message when account is connected and clean URL
  useEffect(() => {
    const success = searchParams.get('success');
    const email = searchParams.get('email');
    const error = searchParams.get('error');

    // Show success message
    if (success === 'true' && email) {
      console.log(
        '[ACCOUNT_CONNECTION] Account connected successfully:',
        email
      );
      toast.success(
        `✅ Account ${decodeURIComponent(email)} connected successfully!`,
        {
          duration: 5000, // Increased from 3000
        }
      );

      // Clean URL using proper React state management
      window.history.replaceState(
        {},
        '',
        '/dashboard/settings?tab=email-accounts'
      );
    } else if (error) {
      console.error('[ACCOUNT_CONNECTION] Connection error:', error);
      toast.error(`Failed to connect: ${decodeURIComponent(error)}`, {
        duration: 10000, // Error toasts last longer
      });
      // Clean URL
      window.history.replaceState(
        {},
        '',
        '/dashboard/settings?tab=email-accounts'
      );
    }
  }, [searchParams]);

  // Load stats for all accounts
  useEffect(() => {
    const loadStats = async () => {
      const stats: Record<string, any> = {};
      for (const account of accounts) {
        try {
          const response = await fetch(
            `/api/email/sync?accountId=${account.id}`
          );
          const result = await response.json();
          if (result.success && result.data) {
            stats[account.id] = {
              emailCount: result.data.emailCount || 0,
              folderCount: result.data.folderCount || 0,
            };
          }
        } catch (err) {
          console.error('Failed to load stats for', account.id, err);
        }
      }
      setAccountStats(stats);
    };

    if (accounts.length > 0) {
      loadStats();
    }
  }, [accounts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K: Open add account modal
      if (modKey && e.key === 'k') {
        e.preventDefault();
        setShowAddModal(true);
      }

      // Cmd/Ctrl + S: Sync current or all
      if (modKey && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          // Cmd/Ctrl + Shift + S: Sync all
          handleSyncAll();
        } else if (expandedAccountId) {
          // Cmd/Ctrl + S: Sync current expanded account
          handleSync(expandedAccountId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedAccountId]);

  const handleAddAccount = async (provider: string): Promise<void> => {
    console.log('[ACCOUNT_ADD] Initiating connection for provider:', provider);

    try {
      console.log('[ACCOUNT_ADD] Calling initiateEmailConnection...');
      const result = await initiateEmailConnection(provider);

      console.log('[ACCOUNT_ADD] initiateEmailConnection result:', result);

      if (result.success && result.url) {
        console.log('[ACCOUNT_ADD] Redirecting to OAuth URL immediately');
        // Remove artificial delay - redirect immediately for better UX
        toast.loading('Opening sign-in window...', { duration: 1000 });
        window.location.href = result.url;
      } else {
        console.log('[ACCOUNT_ADD] OAuth initiation failed:', result.error);
        toast.error(result.error || 'Failed to start connection', {
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('[ACCOUNT_ADD] Error adding account:', error);
      toast.error('Failed to start connection. Please try again.', {
        duration: 10000,
      });
    }
  };

  const handleSync = async (accountId: string): Promise<void> => {
    setSyncingAccountId(accountId);

    const result = await syncEmailAccount(accountId);

    if (result.success) {
      toast.success('Sync started! Refreshing in a moment...', {
        duration: 5000,
      });
      // Refresh after a delay
      setTimeout(() => window.location.reload(), 3000);
    } else {
      toast.error(result.error || 'Failed to sync account', {
        duration: 10000,
      });
    }

    setSyncingAccountId(null);
  };

  const handleRemove = async (accountId: string): Promise<void> => {
    // Find account details
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    const stats = accountStats[accountId] || { emailCount: 0, folderCount: 0 };

    // Show enhanced removal dialog
    setAccountToRemove({
      id: accountId,
      email: account.emailAddress || 'Unknown',
      emailCount: stats.emailCount,
      folderCount: stats.folderCount,
    });
    setShowRemovalDialog(true);
  };

  const handleConfirmRemoval = async (
    disconnectOnly: boolean
  ): Promise<void> => {
    if (!accountToRemove) return;

    setRemovingAccountId(accountToRemove.id);
    setShowRemovalDialog(false);

    if (disconnectOnly) {
      // Disconnect account (pause syncing but keep data)
      const result = await disconnectEmailAccount(accountToRemove.id);

      if (result.success) {
        toast.success(
          'Account disconnected. Syncing paused. You can reconnect anytime.',
          { duration: 5000 }
        );
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(result.error || 'Failed to disconnect account', {
          duration: 10000,
        });
      }

      setRemovingAccountId(null);
      setAccountToRemove(null);
      return;
    }

    // Full removal
    const result = await removeEmailAccount(accountToRemove.id);

    if (result.success) {
      toast.success('Account removed successfully!', { duration: 5000 });
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(result.error || 'Failed to remove account', {
        duration: 10000,
      });
    }

    setRemovingAccountId(null);
    setAccountToRemove(null);
  };

  const handleSetDefault = async (accountId: string): Promise<void> => {
    const result = await setDefaultEmailAccount(accountId);

    if (result.success) {
      toast.success('Default account updated!', { duration: 5000 });
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(result.error || 'Failed to set default account', {
        duration: 10000,
      });
    }
  };

  const handleReconnect = async (
    provider: string,
    accountId: string
  ): Promise<void> => {
    try {
      // Check if account is just disconnected (inactive)
      const account = accounts.find((a) => a.id === accountId);
      if (account?.status === 'inactive') {
        // Simply reactivate the account
        const result = await reconnectEmailAccount(accountId);

        if (result.success) {
          toast.success('Account reconnected successfully!', {
            duration: 5000,
          });
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.error(result.error || 'Failed to reconnect account', {
            duration: 10000,
          });
        }
        return;
      }

      // For error status or other cases, remove and re-authenticate
      await removeEmailAccount(accountId);

      // Then initiate new connection
      const result = await initiateEmailConnection(provider);

      if (result.success && result.url) {
        toast.loading('Redirecting to reconnect your account...', {
          duration: 1000,
        });
        window.location.href = result.url;
      } else {
        toast.error(result.error || 'Failed to start reconnection', {
          duration: 10000,
        });
      }
    } catch {
      toast.error('Failed to reconnect account', { duration: 10000 });
    }
  };

  const handleSyncAll = async (): Promise<void> => {
    const accountsToSync = accounts.filter((a) => a.status !== 'syncing');

    setBulkSyncProgress({
      total: accountsToSync.length,
      syncing: 0,
      completed: 0,
    });

    try {
      if (bulkSyncMode === 'parallel') {
        // Sync all in parallel
        const promises = accountsToSync.map((account) =>
          syncEmailAccount(account.id)
        );
        await Promise.allSettled(promises);
      } else {
        // Sync sequentially
        for (const account of accountsToSync) {
          setBulkSyncProgress((prev) => ({
            ...prev,
            syncing: prev.syncing + 1,
          }));
          await syncEmailAccount(account.id);
          setBulkSyncProgress((prev) => ({
            ...prev,
            syncing: prev.syncing - 1,
            completed: prev.completed + 1,
          }));
        }
      }

      toast.success('All accounts synced successfully!', { duration: 5000 });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast.error('Some accounts failed to sync', { duration: 10000 });
    } finally {
      setBulkSyncProgress({ total: 0, syncing: 0, completed: 0 });
    }
  };

  const getProviderIcon = (provider: string): string => {
    const icons: Record<string, string> = {
      gmail: '📧',
      microsoft: '📮',
      custom: '📨',
    };
    return icons[provider] || '📧';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: 'text-green-600 dark:text-green-400',
      inactive: 'text-gray-500 dark:text-gray-400',
      error: 'text-red-600 dark:text-red-400',
      syncing: 'text-blue-600 dark:text-blue-400',
    };
    return colors[status] || 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Email Accounts
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Connect and manage your email accounts
        </p>
      </div>

      {/* Connected Accounts */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Connected Accounts ({accounts.length})
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              console.log('🔘 ADD ACCOUNT BUTTON CLICKED');
              setShowAddModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Account
          </Button>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 mx-auto text-gray-400 dark:text-white/40 mb-3" />
            <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
              No email accounts connected yet
            </p>
            <Button
              variant="primary"
              onClick={() => {
                console.log('🔘 CONNECT FIRST ACCOUNT BUTTON CLICKED');
                setShowAddModal(true);
              }}
            >
              Connect Your First Account
            </Button>
          </div>
        ) : (
          <>
            {/* Bulk Sync Banner */}
            {accounts.length > 1 && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {bulkSyncProgress.total > 0
                          ? `Syncing ${bulkSyncProgress.syncing} of ${bulkSyncProgress.total} accounts`
                          : `Manage ${accounts.length} connected accounts`}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                        {accounts.filter((a) => a.status === 'syncing').length}{' '}
                        currently syncing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={bulkSyncMode}
                      onChange={(e) =>
                        setBulkSyncMode(
                          e.target.value as 'parallel' | 'sequential'
                        )
                      }
                      className="text-xs px-2 py-1 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="parallel">Parallel (faster)</option>
                      <option value="sequential">Sequential (safer)</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={handleSyncAll}
                      disabled={accounts.every((a) => a.status === 'syncing')}
                    >
                      <RefreshCw className="h-4 w-4 mr-1.5" />
                      Sync All
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Keyboard shortcuts hint */}
            <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono border border-gray-300 dark:border-gray-700">
                  {typeof navigator !== 'undefined' &&
                  navigator.platform.includes('Mac')
                    ? '⌘'
                    : 'Ctrl'}
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono border border-gray-300 dark:border-gray-700">
                  K
                </kbd>
                <span>Add account</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono border border-gray-300 dark:border-gray-700">
                  {typeof navigator !== 'undefined' &&
                  navigator.platform.includes('Mac')
                    ? '⌘'
                    : 'Ctrl'}
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono border border-gray-300 dark:border-gray-700">
                  S
                </kbd>
                <span>Sync</span>
              </span>
            </div>

            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="space-y-4">
                  <AccountStatusCard
                    accountId={account.id}
                    emailAddress={account.emailAddress || 'Unknown'}
                    provider={account.provider}
                    status={
                      account.status as
                        | 'active'
                        | 'syncing'
                        | 'error'
                        | 'disconnected'
                    }
                    lastSyncAt={account.lastSyncAt}
                    syncProgress={account.syncProgress ?? undefined}
                    syncTotal={account.syncTotal ?? undefined}
                    errorMessage={account.errorMessage ?? undefined}
                    isDefault={account.isDefault ?? false}
                    emailCount={accountStats[account.id]?.emailCount}
                    folderCount={accountStats[account.id]?.folderCount}
                    isExpanded={expandedAccountId === account.id}
                    onToggleExpand={() =>
                      setExpandedAccountId(
                        expandedAccountId === account.id ? null : account.id
                      )
                    }
                    onSetDefault={() => handleSetDefault(account.id)}
                    onSync={() => handleSync(account.id)}
                    onReconnect={() =>
                      handleReconnect(account.provider, account.id)
                    }
                    onRemove={() => handleRemove(account.id)}
                    onRetry={() => handleSync(account.id)}
                    onTroubleshoot={() =>
                      window.open('/help/troubleshoot-sync', '_blank')
                    }
                  />

                  {/* Only show sync control panel when expanded */}
                  {expandedAccountId === account.id && (
                    <SyncControlPanel
                      accountId={account.id}
                      emailAddress={account.emailAddress || 'Unknown'}
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Account Instructions */}
      <div className="rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Connecting Your Email
        </h4>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>We support Gmail and Microsoft / Outlook</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>Your credentials are encrypted and never shared</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>OAuth authentication ensures maximum security</span>
          </li>
        </ul>
      </div>

      {/* Add Account Modal */}
      {console.log('🔍 Modal state:', { showAddModal })}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          console.log('🔘 MODAL CLOSE CLICKED');
          setShowAddModal(false);
        }}
        title="Add Email Account"
        description="Choose your email provider to get started"
      >
        <div className="space-y-3">
          {[
            {
              id: 'microsoft',
              name: 'Microsoft / Outlook',
              icon: '📮',
              description: 'Outlook.com, Office 365, Hotmail',
              badge: 'Recommended',
              recommended: true,
            },
            {
              id: 'gmail',
              name: 'Gmail',
              icon: '📧',
              description: 'Google Workspace, personal Gmail',
              badge: 'Recommended',
              recommended: true,
            },
            {
              id: 'imap',
              name: 'Other Email',
              icon: '📨',
              description: 'Yahoo, iCloud, AOL, custom providers',
              badge: null,
              recommended: false,
            },
          ].map((provider) => (
            <button
              key={provider.id}
              onClick={() => {
                console.log('🔘 MODAL PROVIDER BUTTON CLICKED:', provider.id);
                setShowAddModal(false);
                handleAddAccount(provider.id);
              }}
              className={cn(
                'w-full flex items-start gap-3 p-4 rounded-lg border transition-all',
                provider.recommended
                  ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 ring-1 ring-primary/20'
                  : 'border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-gray-50/80 dark:hover:bg-white/10'
              )}
            >
              <span className="text-2xl mt-1">{provider.icon}</span>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {provider.name}
                  </span>
                  {provider.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                      {provider.badge}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60 mt-0.5">
                  {provider.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-50/50 dark:bg-white/5 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-white/60">
            <strong>Note:</strong> You&apos;ll be redirected to authenticate
            with your email provider. We never store your password.
          </p>
        </div>
      </Modal>

      {/* Account Removal Dialog */}
      {accountToRemove && (
        <AccountRemovalDialog
          isOpen={showRemovalDialog}
          onClose={() => {
            setShowRemovalDialog(false);
            setAccountToRemove(null);
          }}
          onConfirm={handleConfirmRemoval}
          accountEmail={accountToRemove.email}
          emailCount={accountToRemove.emailCount}
          folderCount={accountToRemove.folderCount}
          draftCount={0}
        />
      )}
    </div>
  );
}
