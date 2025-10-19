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
} from '@/lib/settings/email-actions';
import type { EmailAccount } from '@/db/schema';
import { toast, confirmDialog } from '@/lib/toast';
import { AccountStatusCard } from './AccountStatusCard';
import { SyncControlPanel } from '@/components/sync/SyncControlPanel';
import { useSearchParams } from 'next/navigation';

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

  // Show success message when account is connected and clean URL
  useEffect(() => {
    const success = searchParams.get('success');
    const email = searchParams.get('email');
    const error = searchParams.get('error');

    // Show success message
    if (success === 'true' && email) {
      console.log('✅ Account connected successfully:', email);
      toast.success(
        `✅ Account ${decodeURIComponent(email)} connected successfully! Refreshing...`,
        {
          duration: 3000,
        }
      );

      // Clean URL and force a hard reload to show the new account
      setTimeout(() => {
        window.history.replaceState(
          {},
          '',
          '/dashboard/settings?tab=email-accounts'
        );
        // Use location.href for a true hard reload
        window.location.href = '/dashboard/settings?tab=email-accounts';
      }, 1500);
    } else if (error) {
      console.error('❌ Connection error:', error);
      toast.error(`Failed to connect: ${decodeURIComponent(error)}`);
      // Clean URL
      window.history.replaceState(
        {},
        '',
        '/dashboard/settings?tab=email-accounts'
      );
    }

    // TEMPORARILY DISABLE CLEANUP TO PREVENT REMOVING NEW ACCOUNTS
    // let hasRunCleanup = false;
    // async function cleanupAccounts() {
    //   if (hasRunCleanup) return;
    //   hasRunCleanup = true;
    //
    //   try {
    //     const { cleanupEmailAccounts } = await import(
    //       '@/lib/sync/cleanup-accounts'
    //     );
    //     const result = await cleanupEmailAccounts();
    //     if (
    //       result?.success &&
    //       result?.deletedCount &&
    //       result.deletedCount > 0
    //     ) {
    //       console.log(
    //         `✅ Cleaned up ${result.deletedCount} problematic account(s)`
    //       );
    //       // Reload to show clean state
    //       setTimeout(() => window.location.reload(), 1000);
    //     }
    //   } catch (error) {
    //     console.error('Error cleaning up accounts:', error);
    //     // Silently fail - not critical
    //   }
    // }
    // cleanupAccounts();
  }, [searchParams]);

  const handleAddAccount = async (provider: string): Promise<void> => {
    console.log(
      '🔘 BUTTON CLICKED: handleAddAccount called with provider:',
      provider
    );

    try {
      console.log('📞 Calling initiateEmailConnection...');
      const result = await initiateEmailConnection(provider);

      console.log('📋 initiateEmailConnection result:', result);

      if (result.success && result.url) {
        console.log('✅ OAuth URL received, redirecting...');
        toast.loading('Redirecting to sign in...');
        // Add delay to see debug messages before redirect
        console.log(
          '⏳ Waiting 2 seconds before redirect to see debug messages...'
        );
        setTimeout(() => {
          console.log('🚀 Redirecting to OAuth URL now...');
          window.location.href = result.url;
        }, 2000);
      } else {
        console.log('❌ OAuth initiation failed:', result.error);
        toast.error(result.error || 'Failed to start connection');
      }
    } catch (error) {
      console.error('❌ Error adding account:', error);
      toast.error('Failed to start connection');
    }
  };

  const handleSync = async (accountId: string): Promise<void> => {
    setSyncingAccountId(accountId);

    const result = await syncEmailAccount(accountId);

    if (result.success) {
      toast.success('Sync started! Refreshing in a moment...');
      // Refresh after a delay
      setTimeout(() => window.location.reload(), 3000);
    } else {
      toast.error(result.error || 'Failed to sync account');
    }

    setSyncingAccountId(null);
  };

  const handleRemove = async (accountId: string): Promise<void> => {
    const confirmed = await confirmDialog(
      'Are you sure you want to remove this email account?'
    );
    if (!confirmed) {
      return;
    }

    setRemovingAccountId(accountId);

    const result = await removeEmailAccount(accountId);

    if (result.success) {
      toast.success('Account removed successfully!');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(result.error || 'Failed to remove account');
    }

    setRemovingAccountId(null);
  };

  const handleSetDefault = async (accountId: string): Promise<void> => {
    const result = await setDefaultEmailAccount(accountId);

    if (result.success) {
      toast.success('Default account updated!');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(result.error || 'Failed to set default account');
    }
  };

  const handleReconnect = async (
    provider: string,
    accountId: string
  ): Promise<void> => {
    try {
      // First remove the old connection
      await removeEmailAccount(accountId);

      // Then initiate new connection
      const result = await initiateEmailConnection(provider);

      if (result.success && result.url) {
        toast.loading('Redirecting to reconnect your account...');
        window.location.href = result.url;
      } else {
        toast.error(result.error || 'Failed to start reconnection');
      }
    } catch {
      toast.error('Failed to reconnect account');
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
          <div className="space-y-6">
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
                  onReconnect={() =>
                    handleReconnect(account.provider, account.id)
                  }
                />

                <div className="flex items-center justify-between px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedAccountId(
                        expandedAccountId === account.id ? null : account.id
                      )
                    }
                    className="text-primary hover:text-primary-600"
                  >
                    {expandedAccountId === account.id
                      ? '▼ Hide Sync Control'
                      : '▶ Show Sync Control'}
                  </Button>

                  <div className="flex items-center gap-2">
                    {!account.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(account.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(account.id)}
                      isLoading={removingAccountId === account.id}
                      disabled={removingAccountId === account.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Sync Control Panel - Expandable */}
                {expandedAccountId === account.id && (
                  <div className="px-4 pt-2 pb-4">
                    <SyncControlPanel
                      accountId={account.id}
                      emailAddress={account.emailAddress || 'Unknown'}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
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
              name: 'Microsoft / Outlook (Graph API)',
              icon: '📮',
              description: 'Direct Microsoft integration',
            },
            {
              id: 'gmail',
              name: 'Gmail (Gmail API)',
              icon: '📧',
              description: 'Direct Google integration',
            },
            {
              id: 'imap',
              name: 'IMAP (Universal)',
              icon: '📨',
              description: 'Works with any email provider',
            },
          ].map((provider) => (
            <button
              key={provider.id}
              onClick={() => {
                console.log('🔘 MODAL PROVIDER BUTTON CLICKED:', provider.id);
                setShowAddModal(false);
                handleAddAccount(provider.id);
              }}
              className="w-full flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-gray-50/80 dark:hover:bg-white/10 transition-all"
            >
              <span className="text-2xl mt-1">{provider.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900 dark:text-white">
                  {provider.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
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
    </div>
  );
}
