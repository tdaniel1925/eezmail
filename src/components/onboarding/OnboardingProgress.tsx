'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface OnboardingStep {
  number: number;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface OnboardingProgressProps {
  currentStep: number;
  steps: string[];
  className?: string;
}

export function OnboardingProgress({
  currentStep,
  steps,
  className,
}: OnboardingProgressProps) {
  console.log(
    '[ONBOARDING_PROGRESS] Current step:',
    currentStep,
    'of',
    steps.length
  );

  return (
    <div className={cn('w-full max-w-3xl mx-auto', className)}>
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Step {currentStep} of {steps.length}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          About {Math.max(1, (steps.length - currentStep + 1) * 2)} minutes
          remaining
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500 ease-out"
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              {/* Circle indicator */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  isCompleted &&
                    'bg-green-500 text-white shadow-lg shadow-green-500/50',
                  isCurrent &&
                    'bg-primary text-white shadow-lg shadow-primary/50 ring-4 ring-primary/20',
                  isUpcoming &&
                    'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
              </div>

              {/* Step label */}
              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center transition-colors',
                  isCompleted && 'text-green-600 dark:text-green-400',
                  isCurrent && 'text-primary font-semibold',
                  isUpcoming && 'text-gray-500 dark:text-gray-400'
                )}
              >
                {step}
              </span>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 h-0.5 transition-all duration-500',
                    isCompleted
                      ? 'bg-green-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  style={{
                    left: `${((index + 0.5) / steps.length) * 100}%`,
                    width: `${(1 / steps.length) * 100}%`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


