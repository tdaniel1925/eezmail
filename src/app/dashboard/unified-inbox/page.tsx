import { EmailLayout } from '@/components/layout/EmailLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { UnifiedInboxView } from '@/components/email/UnifiedInboxView';
import { getUserEmailAccounts } from '@/lib/settings/account-actions';

export default async function UnifiedInboxPage() {
  const accountsResult = await getUserEmailAccounts();
  const accounts = accountsResult.success ? accountsResult.accounts : [];

  const activeAccounts = accounts.filter(
    (account) => account.status === 'active'
  );

  if (activeAccounts.length === 0) {
    return (
      <EmailLayout
        sidebar={<Sidebar />}
        emailList={
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                No Email Accounts
              </h2>
              <p className="text-gray-500">
                Connect an email account to start receiving emails
              </p>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <EmailLayout
      sidebar={<Sidebar />}
      emailList={<UnifiedInboxView accounts={activeAccounts} />}
    />
  );
}

