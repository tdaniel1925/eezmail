'use client';

import useSWR from 'swr';

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

// Fetcher function for SWR
const fetcher = async (url: string) => {
  console.log('[useSettingsData] Fetching from:', url);

  const response = await fetch(url, {
    credentials: 'include', // Include cookies for authentication
  });

  console.log('[useSettingsData] Response status:', response.status);

  if (!response.ok) {
    if (response.status === 401) {
      console.error('[useSettingsData] Not authenticated');
      throw new Error('Not authenticated');
    }
    const errorText = await response.text();
    console.error('[useSettingsData] Request failed:', errorText);
    throw new Error('Failed to load settings');
  }

  const result = await response.json();
  console.log('[useSettingsData] Result:', {
    success: result.success,
    hasData: !!result.data,
    error: result.error,
  });

  if (!result.success || !result.data) {
    console.error('[useSettingsData] Invalid result:', result);
    throw new Error(result.error || 'Failed to load settings');
  }

  // Transform to camelCase
  const transformed = {
    user: {
      id: result.data.user.id,
      email: result.data.user.email,
      fullName: result.data.user.fullName || '',
      avatarUrl: result.data.user.avatarUrl || '',
      name: result.data.user.fullName || result.data.user.email.split('@')[0],
      createdAt: result.data.user.createdAt,
    },
    emailAccounts: result.data.emailAccounts || [],
    settings: result.data.settings || {
      aiScreeningEnabled: true,
      screeningMode: 'strict',
      notificationsEnabled: true,
    },
    subscription: result.data.subscription,
    defaultAccountId: result.data.defaultAccountId,
  } as UserSettingsData;

  console.log('[useSettingsData] Transformed data successfully');
  return transformed;
};

// Custom hook for fetching and caching settings data
export function useSettingsData() {
  const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher, {
    // Revalidate every 5 minutes
    refreshInterval: 300000,
    // Don't revalidate on mount if cached
    revalidateIfStale: false,
    // Keep previous data while revalidating
    keepPreviousData: true,
    // Retry on error
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  });

  return {
    userData: data,
    isLoading,
    isError: error,
    refreshSettings: mutate,
  };
}
