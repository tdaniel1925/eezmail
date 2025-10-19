'use client';

import useSWR from 'swr';
import { getUserSettingsData } from '@/lib/settings/data';

export interface UserSettingsData {
  user: {
    id: string;
    email: string;
    fullName: string;
    name: string;
    avatarUrl: string;
    createdAt: Date;
  };
  emailAccounts: any[];
  settings: {
    aiScreeningEnabled: boolean;
    screeningMode: string;
    notificationsEnabled: boolean;
  };
  subscription: any;
  defaultAccountId: string | null;
}

// Custom hook for fetching and caching settings data
export function useSettingsData() {
  const { data, error, isLoading, mutate } = useSWR(
    'user-settings',
    async () => {
      const response = await getUserSettingsData();
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load settings');
      }

      // Transform to camelCase
      return {
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          fullName: response.data.user.fullName || '',
          avatarUrl: response.data.user.avatarUrl || '',
          name:
            response.data.user.fullName ||
            response.data.user.email.split('@')[0],
          createdAt: response.data.user.createdAt,
        },
        emailAccounts: response.data.emailAccounts,
        settings: response.data.settings || {
          aiScreeningEnabled: true,
          screeningMode: 'strict',
          notificationsEnabled: true,
        },
        subscription: response.data.subscription,
        defaultAccountId: response.data.defaultAccountId,
      } as UserSettingsData;
    },
    {
      // Revalidate every 5 minutes
      refreshInterval: 300000,
      // Don't revalidate on mount if cached
      revalidateIfStale: false,
      // Keep previous data while revalidating
      keepPreviousData: true,
    }
  );

  return {
    userData: data,
    isLoading,
    isError: error,
    refreshSettings: mutate,
  };
}

