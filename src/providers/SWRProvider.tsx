'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

// Global SWR configuration for caching and revalidation
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Revalidate data when window regains focus
        revalidateOnFocus: false,
        // Revalidate data when network reconnects
        revalidateOnReconnect: true,
        // Dedupe requests within 2 seconds
        dedupingInterval: 2000,
        // Cache data for 5 minutes
        focusThrottleInterval: 300000,
        // Retry failed requests
        shouldRetryOnError: true,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        // Keep previous data while revalidating
        keepPreviousData: true,
        // Default fetcher for all SWR hooks
        fetcher: async (url: string) => {
          const res = await fetch(url);
          if (!res.ok) {
            const error = new Error('An error occurred while fetching the data.');
            throw error;
          }
          return res.json();
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

