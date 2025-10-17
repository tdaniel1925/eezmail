'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ModernSidebar } from './ModernSidebar';
import { getLabels } from '@/lib/labels/actions';
import { getPendingTasksCount } from '@/lib/tasks/actions';
import { getStorageInfo } from '@/lib/storage/calculate';
import { redirect } from 'next/navigation';

export async function SidebarDataLoader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Fetch user's email accounts - with error handling
  let accounts: Awaited<ReturnType<typeof db.query.emailAccounts.findMany>> =
    [];
  try {
    accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
      orderBy: [emailAccounts.createdAt],
    });
  } catch (error) {
    console.error('Failed to fetch email accounts:', error);
  }

  // Get first active account or first account
  const currentAccountId =
    accounts.find((acc) => acc.status === 'active')?.id ||
    accounts[0]?.id ||
    null;

  // Fetch labels - with error handling
  let labels: any[] = [];
  try {
    const labelsResult = await getLabels();
    labels = labelsResult.success ? labelsResult.labels || [] : [];
  } catch (error) {
    console.error('Failed to fetch labels:', error);
  }

  // Fetch pending tasks count - with error handling
  let pendingTasksCount = 0;
  try {
    const tasksResult = await getPendingTasksCount();
    pendingTasksCount = tasksResult.success ? tasksResult.count || 0 : 0;
  } catch (error) {
    console.error('Failed to fetch tasks count:', error);
  }

  // Calculate storage (real calculation) - with error handling
  let storage = {
    used: 0,
    total: 15 * 1024 * 1024 * 1024, // Default 15GB
  };

  try {
    const storageInfo = await getStorageInfo(user.id);
    if (storageInfo.success) {
      storage = {
        used: storageInfo.used || 0,
        total: storageInfo.quota || 15 * 1024 * 1024 * 1024,
      };
    }
  } catch (error) {
    console.error('Storage calculation failed:', error);
    // Use default values
  }

  return {
    user: {
      id: user.id,
      name:
        user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
    },
    accounts,
    currentAccountId,
    storage,
    pendingTasksCount,
  };
}
