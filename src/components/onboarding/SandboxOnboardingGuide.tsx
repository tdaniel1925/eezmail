'use client';

/**
 * Sandbox User Onboarding Guide
 * Displays a welcome message and quick start guide for sandbox users
 */

import { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Info,
  Zap,
  Mail,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface OnboardingGuideProps {
  userName?: string | null;
  companyName?: string | null;
}

export function SandboxOnboardingGuide({
  userName,
  companyName,
}: OnboardingGuideProps): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  useEffect(() => {
    // Check if user has seen the guide before
    const seen = localStorage.getItem('sandbox_onboarding_seen');
    if (!seen) {
      setIsVisible(true);
    } else {
      setHasSeenGuide(true);
    }
  }, []);

  const handleDismiss = (): void => {
    localStorage.setItem('sandbox_onboarding_seen', 'true');
    setIsVisible(false);
    setHasSeenGuide(true);
  };

  if (!isVisible && hasSeenGuide) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700"
      >
        <Info className="h-4 w-4" />
        Show Quick Start Guide
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Welcome to {companyName || 'Your Sandbox Environment'}! 🎉
              </h2>
              <p className="mt-2 text-blue-100">
                {userName ? `Hi ${userName}! ` : ''}Get started with EaseMail in
                just a few minutes
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1 text-white hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    You're in a Sandbox Environment
                  </p>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    This is a testing environment with unlimited access to all
                    features. No billing, no limits - perfect for exploring and
                    testing!
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Start Steps */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Quick Start Guide
              </h3>
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold dark:bg-blue-900/30 dark:text-blue-400">
                      1
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Connect Your Email
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Go to Settings → Email Accounts and connect your Gmail,
                      Outlook, or IMAP account. Your emails will sync
                      automatically.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-semibold dark:bg-purple-900/30 dark:text-purple-400">
                      2
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Explore AI Features
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Try our AI-powered email summaries, smart replies, and
                      automatic categorization. Click any email to see AI
                      insights.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 font-semibold dark:bg-green-900/30 dark:text-green-400">
                      3
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Test SMS Messaging
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Send SMS messages directly from the platform. Try voice
                      messages and automated notifications - all included in
                      your sandbox!
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold dark:bg-orange-900/30 dark:text-orange-400">
                      4
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Set Up Automation Rules
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Create rules to automatically categorize, reply, or
                      forward emails. Build your perfect email workflow.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                What's Included in Your Sandbox
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Unlimited Email Storage
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Unlimited SMS Messages
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Unlimited AI Tokens
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    All Premium Features
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Voice Message Support
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Advanced Analytics
                  </span>
                </div>
              </div>
            </div>

            {/* Help Resources */}
            <div>
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                Need Help?
              </h3>
              <div className="space-y-2">
                <a
                  href="/docs"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Mail className="h-4 w-4" />
                  Read the Documentation
                </a>
                <a
                  href="/support"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <MessageSquare className="h-4 w-4" />
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                onChange={(e) => {
                  if (e.target.checked) {
                    localStorage.setItem('sandbox_onboarding_seen', 'true');
                  }
                }}
              />
              Don't show this again
            </label>
            <button
              onClick={handleDismiss}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Let's Get Started!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
