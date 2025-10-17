import { AutoSyncStarred } from '@/components/email/AutoSyncStarred';
import { getUserEmailAccounts } from '@/lib/settings/account-actions';
import { ChatBot } from '@/components/ai/ChatBot';

export default async function StarredPage() {
  const accountsResult = await getUserEmailAccounts();
  const accounts = accountsResult.success ? accountsResult.accounts : [];

  // Get the first active account for auto-sync
  const activeAccount = accounts.find((account) => account.status === 'active');

  if (!activeAccount) {
    return (
      <>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Email Accounts
            </h2>
            <p className="text-gray-500 dark:text-gray-500">
              Connect an email account to start receiving emails
            </p>
          </div>
        </div>
        <ChatBot />
      </>
    );
  }

  return (
    <>
      <AutoSyncStarred accountId={activeAccount.id} />
      <ChatBot />
    </>
  );
}
