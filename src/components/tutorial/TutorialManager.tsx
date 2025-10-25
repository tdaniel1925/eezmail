'use client';

/**
 * Tutorial Manager Component
 *
 * Manages tutorial state and triggers for the dashboard
 */

import { useState, useEffect } from 'react';
import { TutorialOverlay } from './TutorialOverlay';
import {
  firstTimeOnboardingSteps,
  isTutorialCompleted,
  isTutorialSkipped,
} from './tutorialSteps';

interface TutorialManagerProps {
  userId: string;
  isFirstLogin?: boolean;
}

export function TutorialManager({
  userId,
  isFirstLogin = false,
}: TutorialManagerProps): JSX.Element {
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if we should show the first-time onboarding
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Check if onboarding has been completed or skipped
    const completed = isTutorialCompleted('first-time-onboarding');
    const skipped = isTutorialSkipped('first-time-onboarding');

    // Show onboarding if:
    // 1. It's a first login, OR
    // 2. User hasn't completed or skipped it before
    if (isFirstLogin || (!completed && !skipped)) {
      // Delay showing tutorial to let the dashboard load
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isFirstLogin, userId]);

  const handleComplete = () => {
    setShowOnboarding(false);
    console.log('✅ Tutorial completed');
    // You could also track this in the database for analytics
  };

  const handleSkip = () => {
    setShowOnboarding(false);
    console.log('⏭️ Tutorial skipped');
  };

  return (
    <TutorialOverlay
      steps={firstTimeOnboardingSteps}
      isOpen={showOnboarding}
      onComplete={handleComplete}
      onSkip={handleSkip}
      tutorialId="first-time-onboarding"
    />
  );
}

/**
 * Hook to manually trigger tutorials
 */
export function useTutorial() {
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);

  const startTutorial = (tutorialId: string) => {
    setActiveTutorial(tutorialId);
  };

  const endTutorial = () => {
    setActiveTutorial(null);
  };

  return {
    activeTutorial,
    startTutorial,
    endTutorial,
  };
}
