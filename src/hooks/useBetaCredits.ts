'use client';

import { useState, useEffect } from 'react';
import { getCreditStatus } from '@/lib/beta/credits-manager';

export interface BetaCreditsState {
  isLoading: boolean;
  error: string | null;
  hasEmailAccess: boolean; // Always true
  hasSMS: boolean;
  hasAI: boolean;
  smsRemaining: number;
  smsLimit: number;
  smsPercentUsed: number;
  aiRemaining: number;
  aiLimit: number;
  aiPercentUsed: number;
  daysUntilExpiration: number | null;
  isBetaUser: boolean;
}

/**
 * React hook for checking beta user credits and feature access
 *  
 * Usage:
 * ```tsx
 * const credits = useBetaCredits(userId);
 * 
 * if (!credits.hasSMS) {
 *   return <UpgradeButton feature="SMS" />;
 * }
 * ```
 */
export function useBetaCredits(userId: string | null | undefined): BetaCreditsState {
  const [state, setState] = useState<BetaCreditsState>({
    isLoading: true,
    error: null,
    hasEmailAccess: true,
    hasSMS: false,
    hasAI: false,
    smsRemaining: 0,
    smsLimit: 0,
    smsPercentUsed: 0,
    aiRemaining: 0,
    aiLimit: 0,
    aiPercentUsed: 0,
    daysUntilExpiration: null,
    isBetaUser: false,
  });

  useEffect(() => {
    if (!userId) {
      setState({
        isLoading: false,
        error: 'No user ID provided',
        hasEmailAccess: true,
        hasSMS: false,
        hasAI: false,
        smsRemaining: 0,
        smsLimit: 0,
        smsPercentUsed: 0,
        aiRemaining: 0,
        aiLimit: 0,
        aiPercentUsed: 0,
        daysUntilExpiration: null,
        isBetaUser: false,
      });
      return;
    }

    let isMounted = true;

    async function fetchCredits() {
      try {
        const status = await getCreditStatus(userId);

        if (isMounted) {
          setState({
            isLoading: false,
            error: null,
            hasEmailAccess: true, // Always true
            hasSMS: status.sms.hasAccess,
            hasAI: status.ai.hasAccess,
            smsRemaining: status.sms.remaining,
            smsLimit: status.sms.limit,
            smsPercentUsed: status.sms.percentUsed,
            aiRemaining: status.ai.remaining,
            aiLimit: status.ai.limit,
            aiPercentUsed: status.ai.percentUsed,
            daysUntilExpiration: status.daysUntilExpiration,
            isBetaUser: status.daysUntilExpiration !== null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch credits',
            hasEmailAccess: true,
            hasSMS: false,
            hasAI: false,
            smsRemaining: 0,
            smsLimit: 0,
            smsPercentUsed: 0,
            aiRemaining: 0,
            aiLimit: 0,
            aiPercentUsed: 0,
            daysUntilExpiration: null,
            isBetaUser: false,
          });
        }
      }
    }

    fetchCredits();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return state;
}

