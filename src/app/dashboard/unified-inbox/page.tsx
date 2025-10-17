import { UnifiedInboxView } from '@/components/email/UnifiedInboxView';
import { getUserEmailAccounts } from '@/lib/settings/account-actions';
import { ChatBot } from '@/components/ai/ChatBot';

export default async function UnifiedInboxPage() {
  const accountsResult = await getUserEmailAccounts();
  const accounts = accountsResult.success ? accountsResult.accounts : [];

  const activeAccounts = accounts.filter(
    (account) => account.status === 'active'
  );

  if (activeAccounts.length === 0) {
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
      <UnifiedInboxView accounts={activeAccounts} />
      <ChatBot />
    </>
  );
}
