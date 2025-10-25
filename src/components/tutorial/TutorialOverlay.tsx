'use client';

/**
 * Interactive Tutorial Overlay System
 *
 * Features:
 * - Step-by-step walkthrough for first-time users
 * - Highlight UI elements with spotlight effect
 * - Skip/dismiss functionality
 * - Progress tracking
 * - Responsive positioning
 */

import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // CSS selector for element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'type'; // Optional: wait for user action
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  tutorialId: string; // e.g., 'first-time-onboarding', 'email-compose'
}

export function TutorialOverlay({
  steps,
  isOpen,
  onComplete,
  onSkip,
  tutorialId,
}: TutorialOverlayProps): JSX.Element | null {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // Update highlight position when step changes
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const updateHighlight = () => {
      const element = document.querySelector(currentStep.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);

        // Calculate tooltip position based on desired position
        const tooltipPos = calculateTooltipPosition(rect, currentStep.position);
        setTooltipPosition(tooltipPos);

        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Initial update
    updateHighlight();

    // Update on window resize
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [currentStep, isOpen]);

  const calculateTooltipPosition = (
    rect: DOMRect,
    position: TutorialStep['position']
  ): { top: number; left: number } => {
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const spacing = 20;

    switch (position) {
      case 'top':
        return {
          top: rect.top - tooltipHeight - spacing,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
      case 'bottom':
        return {
          top: rect.bottom + spacing,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
      case 'left':
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.left - tooltipWidth - spacing,
        };
      case 'right':
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + spacing,
        };
      case 'center':
      default:
        return {
          top: window.innerHeight / 2 - tooltipHeight / 2,
          left: window.innerWidth / 2 - tooltipWidth / 2,
        };
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    // Save completion status
    localStorage.setItem(`tutorial-${tutorialId}-completed`, 'true');
    onComplete();
  };

  const handleSkip = () => {
    // Save skip status
    localStorage.setItem(`tutorial-${tutorialId}-skipped`, 'true');
    onSkip();
  };

  if (!isOpen || !currentStep) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]">
        {/* Overlay with spotlight effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          style={{
            clipPath: highlightRect
              ? `polygon(
                  0% 0%,
                  0% 100%,
                  ${highlightRect.left}px 100%,
                  ${highlightRect.left}px ${highlightRect.top}px,
                  ${highlightRect.right}px ${highlightRect.top}px,
                  ${highlightRect.right}px ${highlightRect.bottom}px,
                  ${highlightRect.left}px ${highlightRect.bottom}px,
                  ${highlightRect.left}px 100%,
                  100% 100%,
                  100% 0%
                )`
              : undefined,
          }}
          onClick={handleSkip}
        />

        {/* Highlight border around target element */}
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute border-4 border-primary rounded-lg shadow-lg pointer-events-none"
            style={{
              top: highlightRect.top - 4,
              left: highlightRect.left - 4,
              width: highlightRect.width + 8,
              height: highlightRect.height + 8,
              boxShadow:
                '0 0 0 4px rgba(255, 76, 90, 0.2), 0 0 32px rgba(255, 76, 90, 0.4)',
            }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className="absolute bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-primary/20 max-w-sm"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentStep.title}
              </h3>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Skip tutorial"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStepIndex(index)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    index === currentStepIndex
                      ? 'w-6 bg-primary'
                      : index < currentStepIndex
                        ? 'w-2 bg-primary/50'
                        : 'w-2 bg-gray-300 dark:bg-gray-600'
                  )}
                  title={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
              >
                <span>{isLastStep ? 'Complete' : 'Next'}</span>
                {isLastStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Skip button (always visible) */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 px-4 py-2 text-sm font-medium text-white/90 hover:text-white bg-black/20 hover:bg-black/30 backdrop-blur-sm rounded-lg transition-colors border border-white/20"
        >
          Skip Tutorial
        </button>
      </div>
    </AnimatePresence>
  );
}
