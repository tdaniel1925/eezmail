import { TasksView } from '@/components/tasks/TasksView';
import { getUserEmailAccounts } from '@/lib/settings/account-actions';

export default async function TasksPage() {
  const accountsResult = await getUserEmailAccounts();
  const accounts = accountsResult.success ? accountsResult.accounts : [];

  return <TasksView accounts={accounts} />;
}
