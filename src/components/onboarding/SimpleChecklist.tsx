'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Mail,
  FileSignature,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OnboardingProgress } from '@/db/schema';
import { dismissOnboarding } from '@/lib/onboarding/actions';

interface SimpleChecklistProps {
  progress: OnboardingProgress;
  userId: string;
}

export function SimpleChecklist({ progress, userId }: SimpleChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already dismissed or completed
  if (dismissed || progress.dismissedOnboarding) {
    return null;
  }

  const steps = [
    {
      id: 'email',
      title: 'Connect Email Account',
      description: 'Sync your inbox',
      completed: progress.emailConnected,
      link: '/dashboard/settings?tab=email-accounts',
      icon: Mail,
      required: true,
    },
    {
      id: 'signature',
      title: 'Create Email Signature',
      description: 'Add your professional signature',
      completed: progress.signatureConfigured,
      link: '/dashboard/settings?tab=signatures',
      icon: FileSignature,
      required: false,
    },
    {
      id: 'ai',
      title: 'Try AI Reply',
      description: 'Experience AI-powered responses',
      completed: progress.aiReplyTried,
      link: '/dashboard/inbox',
      icon: Sparkles,
      required: false,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const allComplete = completedCount === steps.length;

  // Hide if all complete
  if (allComplete) {
    return null;
  }

  const handleDismiss = async () => {
    setDismissed(true);
    try {
      await dismissOnboarding(userId);
    } catch (error) {
      console.error('Failed to dismiss onboarding:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 relative">
      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Setup
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {completedCount} of {steps.length} completed
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.id}
              href={step.link}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                step.completed
                  ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-750'
              }`}
            >
              {/* Icon/Checkbox */}
              <div className="flex-shrink-0 mt-0.5">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <p className="font-medium text-gray-900 dark:text-white">
                    {step.title}
                  </p>
                  {step.required && (
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {step.description}
                </p>
              </div>

              {/* Status */}
              {step.completed && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Done
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      {completedCount > 0 && completedCount < steps.length && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Great progress! Complete the remaining steps to get the most out of
            easeMail.
          </p>
        </div>
      )}
    </div>
  );
}
