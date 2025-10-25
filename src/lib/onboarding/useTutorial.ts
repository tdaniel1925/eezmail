'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Tutorial } from './tutorial-content';

interface UseTutorialReturn {
  isOpen: boolean;
  currentStep: number;
  hasSeenTutorial: boolean;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  totalSteps: number;
}

export function useTutorial(tutorial: Tutorial | undefined): UseTutorialReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  // Check localStorage on mount
  useEffect(() => {
    if (!tutorial) return;

    const key = `tutorial_seen_${tutorial.id}`;
    const seen = localStorage.getItem(key);
    setHasSeenTutorial(seen === 'true');
  }, [tutorial]);

  const startTutorial = useCallback(() => {
    setIsOpen(true);
    setCurrentStep(0);
    setStartTime(Date.now());
  }, []);

  const nextStep = useCallback(() => {
    if (!tutorial) return;

    if (currentStep < tutorial.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTutorial();
    }
  }, [tutorial, currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    if (!tutorial) return;

    setIsOpen(false);
    setCurrentStep(0);

    // Mark as seen in localStorage
    const key = `tutorial_seen_${tutorial.id}`;
    localStorage.setItem(key, 'true');
    setHasSeenTutorial(true);
  }, [tutorial]);

  const completeTutorial = useCallback(() => {
    if (!tutorial) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    setIsOpen(false);
    setCurrentStep(0);

    // Mark as seen in localStorage
    const key = `tutorial_seen_${tutorial.id}`;
    localStorage.setItem(key, 'true');
    setHasSeenTutorial(true);

    // TODO: Call server action to track completion
    // trackTutorialCompletion(tutorial.id, timeSpent);
  }, [tutorial, startTime]);

  return {
    isOpen,
    currentStep,
    hasSeenTutorial,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    totalSteps: tutorial?.steps.length || 0,
  };
}

