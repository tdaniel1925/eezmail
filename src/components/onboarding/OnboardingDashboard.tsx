'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingProgress } from '@/db/schema';
import { ProgressTracker } from './ProgressTracker';
import { PhaseCard } from './PhaseCard';
import { TutorialOverlay } from './TutorialOverlay';
import { getTutorial } from '@/lib/onboarding/tutorial-content';
import { useTutorial } from '@/lib/onboarding/useTutorial';

interface Props {
  progress: OnboardingProgress;
  userId: string;
}

export function OnboardingDashboard({ progress, userId }: Props) {
  const router = useRouter();
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);

  const activeTutorial = activeTutorialId
    ? getTutorial(activeTutorialId)
    : undefined;
  const tutorial = useTutorial(activeTutorial);

  // Calculate completion percentage
  const totalSteps = 11; // 3 + 3 + 4 + 1 (completion)
  const completedSteps = [
    progress.emailConnected,
    progress.signatureConfigured,
    progress.profileCompleted,
    progress.aiReplyTried,
    progress.smartInboxViewed,
    progress.keyboardShortcutsLearned,
    progress.contactsExplored,
    progress.automationCreated,
    progress.voiceFeatureTried,
    progress.chatbotUsed,
    progress.onboardingCompleted,
  ].filter(Boolean).length;

  const percentComplete = Math.round((completedSteps / totalSteps) * 100);

  // Phase data
  const phases = [
    {
      id: 1,
      title: 'Essential Setup',
      description: 'Get your account ready in 5 minutes',
      steps: [
        {
          id: 'emailConnected',
          label: 'Connect email account',
          completed: progress.emailConnected,
          link: '/dashboard/settings?tab=email-accounts',
          tutorialId: 'emailConnected',
        },
        {
          id: 'signatureConfigured',
          label: 'Set up email signature',
          completed: progress.signatureConfigured,
          link: '/dashboard/settings?tab=email-signatures',
          tutorialId: 'signatureConfigured',
        },
        {
          id: 'profileCompleted',
          label: 'Complete your profile',
          completed: progress.profileCompleted,
          link: '/dashboard/settings',
          tutorialId: 'profileCompleted',
        },
      ],
      locked: false,
    },
    {
      id: 2,
      title: 'Quick Wins',
      description: 'Discover AI-powered productivity',
      steps: [
        {
          id: 'aiReplyTried',
          label: 'Try AI Reply Assistant',
          completed: progress.aiReplyTried,
          link: '/dashboard/inbox',
          tooltip: 'Open any email and click the AI Reply buttons',
          tutorialId: 'aiReplyTried',
        },
        {
          id: 'smartInboxViewed',
          label: 'Explore Smart Inbox',
          completed: progress.smartInboxViewed,
          link: '/dashboard/inbox',
          tooltip: 'Check out your Priority Inbox, Feed, and Paper Trail categories',
          tutorialId: 'smartInboxViewed',
        },
        {
          id: 'keyboardShortcutsLearned',
          label: 'Learn keyboard shortcuts',
          completed: progress.keyboardShortcutsLearned,
          link: '/dashboard/inbox',
          tooltip: 'Press ? to see all keyboard shortcuts',
          tutorialId: 'keyboardShortcutsLearned',
        },
      ],
      locked: progress.currentPhase < 2,
    },
    {
      id: 3,
      title: 'Power User',
      description: 'Unlock advanced features',
      steps: [
        {
          id: 'contactsExplored',
          label: 'Explore Contact Intelligence',
          completed: progress.contactsExplored,
          link: '/dashboard/contacts',
          tutorialId: 'contactsExplored',
        },
        {
          id: 'automationCreated',
          label: 'Create automation rule',
          completed: progress.automationCreated,
          link: '/dashboard/settings',
          tooltip: 'Set up rules to auto-organize your emails',
          tutorialId: 'automationCreated',
        },
        {
          id: 'voiceFeatureTried',
          label: 'Try voice features',
          completed: progress.voiceFeatureTried,
          link: '/dashboard/contacts',
          tooltip: 'Send voice messages from contact records',
          tutorialId: 'voiceFeatureTried',
        },
        {
          id: 'chatbotUsed',
          label: 'Use AI chatbot assistant',
          completed: progress.chatbotUsed,
          link: '/dashboard/inbox',
          tooltip: 'Ask the AI assistant about your emails',
          tutorialId: 'chatbotUsed',
        },
      ],
      locked: progress.currentPhase < 3,
    },
  ];

  const handleTutorialClick = (tutorialId: string) => {
    setActiveTutorialId(tutorialId);
    tutorial.startTutorial();
  };

  const handleTutorialComplete = () => {
    if (activeTutorial) {
      router.push(activeTutorial.destinationLink);
    }
    setActiveTutorialId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Getting Started with easeMail
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Learn the features that will transform your email workflow
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressTracker
          percent={percentComplete}
          completedSteps={completedSteps}
          totalSteps={totalSteps}
        />

        {/* Phase Cards */}
        <div className="space-y-6 mt-8">
          {phases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              userId={userId}
              onStepClick={(link) => {
                router.push(link);
              }}
              onTutorialClick={handleTutorialClick}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-12 flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {progress.onboardingCompleted ? 'All set!' : 'Ready to dive in?'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {progress.onboardingCompleted
                ? 'You have completed all onboarding steps.'
                : 'You can always come back to continue learning.'}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/inbox')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Go to Inbox
          </button>
        </div>
      </div>

      {/* Tutorial Overlay */}
      {activeTutorial && (
        <TutorialOverlay
          tutorial={activeTutorial}
          isOpen={tutorial.isOpen}
          currentStep={tutorial.currentStep}
          onNext={tutorial.nextStep}
          onPrev={tutorial.prevStep}
          onSkip={tutorial.skipTutorial}
          onComplete={handleTutorialComplete}
        />
      )}
    </div>
  );
}
