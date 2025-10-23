import { AutoSyncInbox } from '@/components/email/AutoSyncInbox';
import { getUserEmailAccounts } from '@/lib/settings/account-actions';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component
function InboxLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading inbox...
        </p>
      </div>
    </div>
  );
}

// No accounts component
function NoAccountsMessage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Email Accounts Connected
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect an email account to start managing your emails
          </p>
        </div>
        <a
          href="/dashboard/settings?tab=email-accounts"
          className="inline-flex items-center px-4 py-2 bg-[#FF4C5A] text-white rounded-lg hover:bg-[#FF4C5A]/90 transition-colors"
        >
          Connect Account
        </a>
      </div>
    </div>
  );
}

export default async function InboxPage() {
  try {
    const accountsResult = await getUserEmailAccounts();

    // If fetching accounts failed, show error but don't block
    if (!accountsResult.success) {
      console.error('Failed to fetch accounts:', accountsResult.error);
      return <NoAccountsMessage />;
    }

    const accounts = accountsResult.accounts || [];

    // Find any active or connected account (more lenient check)
    const usableAccount = accounts.find(
      (account) =>
        account.status === 'active' ||
        account.status === 'syncing' ||
        account.status === 'connected'
    );

    // If no accounts at all, show the no accounts message
    if (accounts.length === 0) {
      return <NoAccountsMessage />;
    }

    // If we have accounts but none are active, use the first one anyway
    const accountToUse = usableAccount || accounts[0];

    return (
      <Suspense fallback={<InboxLoading />}>
        <AutoSyncInbox accountId={accountToUse.id} title="Inbox" />
      </Suspense>
    );
  } catch (error) {
    console.error('Error in InboxPage:', error);
    // Fallback to showing loading, client will handle reconnection
    return <InboxLoading />;
  }
}
