import { AutoSyncReplyQueue } from '@/components/email/AutoSyncReplyQueue';
import { getUserEmailAccounts } from '@/lib/settings/account-actions';

export default async function ReplyQueuePage() {
  const accountsResult = await getUserEmailAccounts();
  const accounts = accountsResult.success ? accountsResult.accounts : [];

  if (accounts.length === 0) {
    return (
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
    );
  }

  return <AutoSyncReplyQueue accounts={accounts} title="Reply Queue" />;
}
