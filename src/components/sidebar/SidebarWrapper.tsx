'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModernSidebar } from './ModernSidebar';
import { useSidebarStore } from '@/stores/sidebarStore';
import { getLabels } from '@/lib/labels/actions';
import { getFolderCounts } from '@/lib/folders/counts';
import type { EmailAccount } from '@/db/schema';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SidebarWrapperProps {
  initialData: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    accounts: EmailAccount[];
    currentAccountId: string | null;
    storage: {
      used: number;
      total: number;
    };
    pendingTasksCount: number;
  };
}

export function SidebarWrapper({ initialData }: SidebarWrapperProps) {
  const router = useRouter();
  const [currentAccountId, setCurrentAccountId] = useState(
    initialData.currentAccountId
  );
  const { setUnreadCounts, setCustomLabels } = useSidebarStore();

  // Load labels on mount
  useEffect(() => {
    async function loadLabels() {
      try {
        const result = await getLabels();
        if (result.success && result.labels) {
          setCustomLabels(result.labels);
        }
      } catch (error) {
        console.error('Failed to load labels:', error);
      }
    }
    loadLabels();
  }, [setCustomLabels]);

  // Load folder counts on mount (initial load only, SWR handles updates)
  useEffect(() => {
    async function loadCounts() {
      try {
        const counts = await getFolderCounts();
        setUnreadCounts(counts);
      } catch (error) {
        console.error('Failed to load folder counts:', error);
        // Set empty counts to prevent UI errors
        setUnreadCounts({
          inbox: 0,
          drafts: 0,
          replyQueue: 0,
          screener: 0,
          newsFeed: 0,
          starred: 0,
          scheduled: 0,
          spam: 0,
          trash: 0,
          unifiedInbox: 0,
          archive: 0,
          sent: 0,
        });
      }
    }
    loadCounts();
    // No interval - useFolderCounts hook will handle periodic updates
  }, [setUnreadCounts]);

  const handleAccountChange = (accountId: string) => {
    setCurrentAccountId(accountId);
    toast.success('Account switched');
    router.refresh();
  };

  const handleAddAccount = () => {
    router.push('/dashboard/settings?tab=email-accounts');
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/signin');
    toast.success('Signed out successfully');
  };

  return (
    <ModernSidebar
      user={initialData.user}
      accounts={initialData.accounts}
      currentAccountId={currentAccountId}
      storage={initialData.storage}
      onAccountChange={handleAccountChange}
      onAddAccount={handleAddAccount}
      onSignOut={handleSignOut}
      pendingTasksCount={initialData.pendingTasksCount}
    />
  );
}
