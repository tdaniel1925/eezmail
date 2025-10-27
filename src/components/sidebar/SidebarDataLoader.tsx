'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts, emailFolders, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

  // ⚡ PERFORMANCE OPTIMIZATION: Run all queries in parallel
  const [
    accountsResult,
    labelsResult,
    tasksResult,
    storageResult,
    dbUserResult,
  ] = await Promise.allSettled([
    // Query 1: Email accounts
    db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
      orderBy: [emailAccounts.createdAt],
      columns: {
        id: true,
        emailAddress: true,
        provider: true,
        status: true,
        createdAt: true,
      },
    }),

    // Query 2: Labels
    getLabels(),

    // Query 3: Pending tasks count
    getPendingTasksCount(),

    // Query 4: Storage info (cached, throttled)
    getStorageInfo(user.id),

    // Query 5: User role information from database
    db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        role: true,
        roleHierarchy: true,
      },
    }),
  ]);

  // Process results with proper error handling
  const accounts =
    accountsResult.status === 'fulfilled' ? accountsResult.value : [];

  const labels =
    labelsResult.status === 'fulfilled' && labelsResult.value.success
      ? labelsResult.value.labels || []
      : [];

  const pendingTasksCount =
    tasksResult.status === 'fulfilled' && tasksResult.value.success
      ? tasksResult.value.count || 0
      : 0;

  const storage =
    storageResult.status === 'fulfilled' && storageResult.value.success
      ? {
          used: storageResult.value.used || 0,
          total: storageResult.value.quota || 15 * 1024 * 1024 * 1024,
        }
      : {
          used: 0,
          total: 15 * 1024 * 1024 * 1024, // Default 15GB
        };

  // Get user role information from database
  const dbUser =
    dbUserResult.status === 'fulfilled' ? dbUserResult.value : null;

  // Get first active account or first account
  const currentAccountId =
    accounts.find((acc) => acc.status === 'active')?.id ||
    accounts[0]?.id ||
    null;

  return {
    user: {
      id: user.id,
      name:
        user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      role: dbUser?.role || undefined,
      roleHierarchy: dbUser?.roleHierarchy || undefined,
    },
    accounts,
    currentAccountId,
    storage,
    pendingTasksCount,
  };
}
