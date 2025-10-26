'use client';

import { motion } from 'framer-motion';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import type { TutorialStep } from '@/lib/onboarding/tutorial-content';

interface TutorialTooltipProps {
  step: TutorialStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  position?: { top: number; left: number };
}

export function TutorialTooltip({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  position,
}: TutorialTooltipProps) {
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed z-[10001] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-primary/30 max-w-md"
      style={{
        top: position?.top || '50%',
        left: position?.left || '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)',
      }}
    >
      {/* Close Button */}
      <button
        onClick={onSkip}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="p-6">
        {/* Step Counter */}
        <div className="text-xs font-semibold text-primary mb-2">
          Step {currentStepIndex + 1} of {totalSteps}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
          {step.description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Skip Tutorial
        </button>

        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <button
              onClick={onPrev}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <button
            onClick={onNext}
            className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
          >
            {isLastStep ? 'Finish' : 'Next'}
            {!isLastStep && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}


