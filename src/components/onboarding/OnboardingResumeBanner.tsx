'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X, ChevronRight } from 'lucide-react';
import type { OnboardingProgress } from '@/db/schema';

interface OnboardingResumeBannerProps {
  progress: OnboardingProgress;
  userId: string;
}

export function OnboardingResumeBanner({
  progress,
  userId,
}: OnboardingResumeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if dismissed, completed, or user has explicitly dismissed onboarding
  if (
    dismissed ||
    progress.onboardingCompleted ||
    progress.dismissedOnboarding
  ) {
    return null;
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    let completed = 0;
    const total = 11; // Total steps in onboarding

    if (progress.emailConnected) completed++;
    if (progress.signatureConfigured) completed++;
    if (progress.profileCompleted) completed++;
    if (progress.aiReplyTried) completed++;
    if (progress.smartInboxViewed) completed++;
    if (progress.keyboardShortcutsLearned) completed++;
    if (progress.contactsExplored) completed++;
    if (progress.automationCreated) completed++;
    if (progress.voiceFeatureTried) completed++;
    if (progress.chatbotUsed) completed++;
    if (progress.foldersConfigured) completed++;

    return Math.round((completed / total) * 100);
  };

  // Determine where to send the user based on current step
  const getResumeUrl = () => {
    const step = progress.onboardingStep || 'account_connection';

    const stepUrls: Record<string, string> = {
      account_connection: '/dashboard/settings?tab=email-accounts',
      folder_selection: '/dashboard/onboarding', // Will need account ID
      profile_setup: '/dashboard/settings/profile',
      complete: '/dashboard',
    };

    return stepUrls[step] || '/dashboard/onboarding';
  };

  const progressPercent = calculateProgress();

  // Only show banner if progress is between 1-99%
  if (progressPercent === 0 || progressPercent === 100) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-b border-blue-200 dark:border-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Progress Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <span className="text-sm font-bold text-primary">
                  {progressPercent}%
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Continue Your Setup
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  You're {progressPercent}% complete - finish setting up your
                  account
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
            <Button asChild size="sm">
              <Link href={getResumeUrl()} className="gap-1">
                Continue Setup
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
