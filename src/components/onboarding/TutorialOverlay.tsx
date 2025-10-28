'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TutorialTooltip } from './TutorialTooltip';
import type { Tutorial } from '@/lib/onboarding/tutorial-content';

interface TutorialOverlayProps {
  tutorial: Tutorial;
  isOpen: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function TutorialOverlay({
  tutorial,
  isOpen,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: TutorialOverlayProps) {
  const router = useRouter();
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [spotlightPosition, setSpotlightPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const step = tutorial.steps[currentStep];

  // Calculate positions when step changes
  useEffect(() => {
    if (!isOpen || !step) return;

    // If step has a target selector, find the element and calculate position
    if (step.targetSelector && step.highlight) {
      const targetElement = document.querySelector(step.targetSelector);

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        setSpotlightPosition({ x: centerX, y: centerY });

        // Calculate tooltip position based on preferred direction
        const tooltipWidth = 400;
        const tooltipHeight = 200;
        const padding = 20;

        let top = 0;
        let left = 0;

        switch (step.position) {
          case 'top':
            top = rect.top - tooltipHeight - padding;
            left = centerX - tooltipWidth / 2;
            break;
          case 'bottom':
            top = rect.bottom + padding;
            left = centerX - tooltipWidth / 2;
            break;
          case 'left':
            top = centerY - tooltipHeight / 2;
            left = rect.left - tooltipWidth - padding;
            break;
          case 'right':
            top = centerY - tooltipHeight / 2;
            left = rect.right + padding;
            break;
          default:
            // Center on screen
            top = window.innerHeight / 2 - tooltipHeight / 2;
            left = window.innerWidth / 2 - tooltipWidth / 2;
        }

        // Keep tooltip in viewport
        top = Math.max(
          10,
          Math.min(top, window.innerHeight - tooltipHeight - 10)
        );
        left = Math.max(
          10,
          Math.min(left, window.innerWidth - tooltipWidth - 10)
        );

        setTooltipPosition({ top, left });

        // Scroll element into view
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else {
        // Element not found, center tooltip
        setSpotlightPosition(null);
        setTooltipPosition(null);
      }
    } else {
      // No target, center tooltip
      setSpotlightPosition(null);
      setTooltipPosition(null);
    }
  }, [isOpen, step, currentStep]);

  // Handle completion
  useEffect(() => {
    if (currentStep >= tutorial.steps.length && isOpen) {
      onComplete();
      // Navigate to destination after a brief delay
      setTimeout(() => {
        router.push(tutorial.destinationLink);
      }, 500);
    }
  }, [
    currentStep,
    tutorial.steps.length,
    tutorial.destinationLink,
    isOpen,
    onComplete,
    router,
  ]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop with spotlight effect */}
      <div
        className="fixed inset-0 z-[10000] transition-all duration-300"
        style={{
          background: spotlightPosition
            ? `radial-gradient(circle 200px at ${spotlightPosition.x}px ${spotlightPosition.y}px, transparent 0%, rgba(0, 0, 0, 0.7) 100%)`
            : 'rgba(0, 0, 0, 0.7)',
        }}
        onClick={onSkip}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        {step && (
          <TutorialTooltip
            key={currentStep}
            step={step}
            currentStepIndex={currentStep}
            totalSteps={tutorial.steps.length}
            onNext={onNext}
            onPrev={onPrev}
            onSkip={onSkip}
            position={tooltipPosition || undefined}
          />
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}



