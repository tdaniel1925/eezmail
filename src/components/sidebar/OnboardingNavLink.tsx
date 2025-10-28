'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export function OnboardingNavLink() {
  const pathname = usePathname();
  const [progress, setProgress] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    async function loadProgress() {
      const response = await fetch('/api/onboarding/progress');
      if (response.ok) {
        const data = await response.json();

        const totalSteps = 11;
        const completedSteps = [
          data.emailConnected,
          data.signatureConfigured,
          data.profileCompleted,
          data.aiReplyTried,
          data.smartInboxViewed,
          data.keyboardShortcutsLearned,
          data.contactsExplored,
          data.automationCreated,
          data.voiceFeatureTried,
          data.chatbotUsed,
          data.onboardingCompleted,
        ].filter(Boolean).length;

        const percent = Math.round((completedSteps / totalSteps) * 100);
        setProgress(percent);
        setIsComplete(data.onboardingCompleted);
        setIsDismissed(data.dismissedOnboarding);
      }
    }

    loadProgress();
  }, [pathname]);

  // Hide if complete or dismissed
  if (isComplete || isDismissed) return null;

  const isActive = pathname === '/dashboard/onboarding';

  return (
    <Link
      href="/dashboard/onboarding"
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <GraduationCap className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 flex items-center justify-between">
        <span className="text-sm font-medium">Getting Started</span>
        {progress !== null && (
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {progress}%
          </span>
        )}
      </div>
    </Link>
  );
}



