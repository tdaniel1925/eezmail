'use client';

import { useState } from 'react';
import {
  Check,
  ChevronRight,
  Mail,
  Zap,
  Folder,
  Settings,
  Sparkles,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  estimatedTime: string;
  completed: boolean;
  content: React.ReactNode;
}

export function QuickStartGuide(): JSX.Element {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps: Step[] = [
    {
      id: 'connect-account',
      title: 'Connect Your First Email Account',
      description: 'Link Gmail, Outlook, or any IMAP email',
      icon: Mail,
      estimatedTime: '2 minutes',
      completed: completedSteps.has('connect-account'),
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Connect Your Email Account
          </h4>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-semibold flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-white/70">
                  Go to <strong>Settings → Connected Accounts</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-semibold flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-white/70">
                  Click <strong>&quot;Add Email Account&quot;</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-semibold flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-white/70">
                  Choose your email provider:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600 dark:text-white/60">
                  <li>
                    <strong>Gmail:</strong> Sign in with Google (OAuth - most
                    secure)
                  </li>
                  <li>
                    <strong>Outlook/Microsoft:</strong> Sign in with Microsoft
                  </li>
                  <li>
                    <strong>Yahoo:</strong> Use app-specific password
                  </li>
                  <li>
                    <strong>IMAP:</strong> Enter server details manually
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-semibold flex-shrink-0">
                4
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-white/70">
                  Wait for initial sync to complete (usually 1-2 minutes)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Pro Tip:</strong> We recommend starting with OAuth
              (Gmail/Outlook) as it&apos;s the most secure method. You can
              connect up to 3 accounts on the free plan!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'understand-categories',
      title: 'Understand Imbox, Feed & Paper Trail',
      description: 'Learn how emails are organized',
      icon: Folder,
      estimatedTime: '1 minute',
      completed: completedSteps.has('understand-categories'),
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Three Smart Categories
          </h4>

          <div className="space-y-3">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <h5 className="font-semibold text-gray-900 dark:text-white">
                  📬 Imbox (Important)
                </h5>
              </div>
              <p className="text-sm text-gray-700 dark:text-white/70">
                Your VIP inbox for important emails from people and services you
                care about.
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60 mt-2">
                Examples: Messages from colleagues, clients, friends, family
              </p>
            </div>

            <div className="rounded-lg border border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <h5 className="font-semibold text-gray-900 dark:text-white">
                  📰 Feed (Updates)
                </h5>
              </div>
              <p className="text-sm text-gray-700 dark:text-white/70">
                Newsletters, updates, and marketing emails you can read when you
                have time.
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60 mt-2">
                Examples: Newsletters, promotions, social media notifications
              </p>
            </div>

            <div className="rounded-lg border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                <h5 className="font-semibold text-gray-900 dark:text-white">
                  🧾 Paper Trail (Receipts)
                </h5>
              </div>
              <p className="text-sm text-gray-700 dark:text-white/70">
                Transactional emails, receipts, and confirmations organized for
                reference.
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60 mt-2">
                Examples: Order confirmations, receipts, shipping notifications
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 p-4">
            <p className="text-sm text-purple-900 dark:text-purple-300">
              <strong>How it works:</strong> Our AI automatically categorizes
              incoming emails. You can always move emails between categories or
              train the system to match your preferences!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'enable-ai',
      title: 'Enable AI Features',
      description: 'Let AI help you manage your inbox',
      icon: Sparkles,
      estimatedTime: '1 minute',
      completed: completedSteps.has('enable-ai'),
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Unlock AI-Powered Email Management
          </h4>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">
                  Email Screening
                </h5>
                <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
                  AI analyzes new senders and suggests the best category for
                  their emails
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">
                  Smart Summaries
                </h5>
                <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
                  Get the gist of long emails instantly with AI-generated
                  summaries
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">
                  Quick Replies
                </h5>
                <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
                  AI suggests contextual responses that match your communication
                  style
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">
                  Writing Assistant
                </h5>
                <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
                  Improve your emails with tone adjustments, grammar fixes, and
                  suggestions
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              To enable AI features:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700 dark:text-white/70">
              <li>
                Go to <strong>Settings → AI Preferences</strong>
              </li>
              <li>Toggle on the features you want to use</li>
              <li>Customize AI behavior (tone, creativity level, etc.)</li>
              <li>Save your preferences</li>
            </ol>
          </div>

          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 p-4">
            <p className="text-sm text-yellow-900 dark:text-yellow-300">
              <strong>Privacy Note:</strong> AI features process emails locally
              when possible. Your data is never used to train models or shared
              with third parties.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'customize-settings',
      title: 'Customize Your Experience',
      description: 'Personalize notifications, appearance & more',
      icon: Settings,
      estimatedTime: '3 minutes',
      completed: completedSteps.has('customize-settings'),
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Make EaseMail Yours
          </h4>

          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                🎨 Appearance
              </h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-white/70 pl-4">
                <li>• Choose between Light, Dark, or System theme</li>
                <li>• Adjust email density (comfortable, compact, spacious)</li>
                <li>• Enable glassmorphism effects</li>
                <li>• Customize accent colors</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                🔔 Notifications
              </h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-white/70 pl-4">
                <li>• Set notification preferences per category</li>
                <li>• Enable/disable desktop notifications</li>
                <li>• Configure notification sounds</li>
                <li>• Set quiet hours</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                ⚡ Keyboard Shortcuts
              </h5>
              <p className="text-sm text-gray-700 dark:text-white/70 pl-4 mb-2">
                Learn essential shortcuts to work faster:
              </p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-white/60 pl-4">
                <li>
                  •{' '}
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                    C
                  </kbd>{' '}
                  - Compose new email
                </li>
                <li>
                  •{' '}
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                    R
                  </kbd>{' '}
                  - Reply to email
                </li>
                <li>
                  •{' '}
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                    E
                  </kbd>{' '}
                  - Archive email
                </li>
                <li>
                  •{' '}
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                    ?
                  </kbd>{' '}
                  - View all shortcuts
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                📁 Folders & Labels
              </h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-white/70 pl-4">
                <li>• Create custom folders for organization</li>
                <li>• Set up automatic rules for sorting</li>
                <li>• Use labels to categorize emails</li>
                <li>• Configure folder colors and icons</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 p-4">
            <p className="text-sm text-green-900 dark:text-green-300">
              <strong>Quick Tip:</strong> Press{' '}
              <kbd className="px-2 py-1 bg-green-200 dark:bg-green-700 rounded text-xs">
                Cmd/Ctrl + ,
              </kbd>{' '}
              anytime to open settings!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'learn-actions',
      title: 'Master Quick Actions',
      description: 'Reply Later, Set Aside & more',
      icon: Zap,
      estimatedTime: '2 minutes',
      completed: completedSteps.has('learn-actions'),
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Powerful Email Actions
          </h4>

          <div className="space-y-3">
            <div className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                ⏰ Reply Later
              </h5>
              <p className="text-sm text-gray-700 dark:text-white/70 mb-2">
                Schedule a reminder to respond to an email at a better time.
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60">
                <strong>How:</strong> Click the clock icon, choose when to be
                reminded, and the email will reappear in your inbox at that
                time.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                📌 Set Aside
              </h5>
              <p className="text-sm text-gray-700 dark:text-white/70 mb-2">
                Temporarily remove emails from your inbox to reduce clutter.
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60">
                <strong>How:</strong> Swipe or click &quot;Set Aside&quot;.
                Access set aside emails anytime from the sidebar.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                ⭐ Star
              </h5>
              <p className="text-sm text-gray-700 dark:text-white/70 mb-2">
                Mark important emails you need to reference later.
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60">
                <strong>How:</strong> Click the star icon. View all starred
                emails from the sidebar.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                📦 Archive
              </h5>
              <p className="text-sm text-gray-700 dark:text-white/70 mb-2">
                Remove emails from your inbox while keeping them searchable.
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60">
                <strong>How:</strong> Press{' '}
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                  E
                </kbd>{' '}
                or click the archive icon.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 p-4">
            <p className="text-sm text-indigo-900 dark:text-indigo-300">
              <strong>Power User Tip:</strong> Combine these actions with rules
              to automate your workflow. For example, automatically set aside
              newsletters to read on weekends!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleComplete = (stepId: string): void => {
    setCompletedSteps((prev) => new Set([...prev, stepId]));
  };

  const handleNext = (): void => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const completedCount = completedSteps.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <PlayCircle className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quick Start Guide
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-white/60">
          Get up and running in under 10 minutes
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700 dark:text-white/70">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-gray-600 dark:text-white/60">
            {completedCount}/{steps.length} completed
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all flex-shrink-0',
                currentStep === index
                  ? 'border-primary bg-primary/10 text-primary'
                  : completedSteps.has(step.id)
                    ? 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10'
              )}
            >
              {completedSteps.has(step.id) ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span>{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Current Step Content */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {currentStepData.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-white/60">
              {currentStepData.description} • {currentStepData.estimatedTime}
            </p>
          </div>
          {completedSteps.has(currentStepData.id) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium">
              <Check className="h-4 w-4" />
              Done
            </div>
          )}
        </div>

        <div className="mt-6">{currentStepData.content}</div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/70 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-3">
            {!completedSteps.has(currentStepData.id) && (
              <button
                onClick={() => handleComplete(currentStepData.id)}
                className="px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
              >
                Mark as Complete
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2"
              >
                Go to Dashboard
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* All Done Message */}
      {completedCount === steps.length && (
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
            <Check className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            🎉 You&apos;re All Set!
          </h3>
          <p className="text-gray-700 dark:text-white/70 mb-4">
            Great job completing the quick start guide. You&apos;re ready to
            take control of your inbox!
          </p>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            Start Using EaseMail
          </button>
        </div>
      )}
    </div>
  );
}
