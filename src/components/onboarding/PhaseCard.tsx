'use client';

import { CheckCircle2, Circle, Lock, ArrowRight, BookOpen } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  completed: boolean;
  link: string;
  tooltip?: string;
  tutorialId?: string;
}

interface Phase {
  id: number;
  title: string;
  description: string;
  steps: Step[];
  locked: boolean;
}

interface Props {
  phase: Phase;
  userId: string;
  onStepClick: (link: string) => void;
  onTutorialClick: (tutorialId: string) => void;
}

export function PhaseCard({
  phase,
  userId,
  onStepClick,
  onTutorialClick,
}: Props) {
  const completedCount = phase.steps.filter((s) => s.completed).length;
  const totalCount = phase.steps.length;
  const isComplete = completedCount === totalCount;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border p-6 transition-all ${
        phase.locked
          ? 'border-gray-200 dark:border-gray-700 opacity-60'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {phase.title}
            </h3>
            {phase.locked && <Lock className="w-5 h-5 text-gray-400" />}
            {isComplete && !phase.locked && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {phase.description}
          </p>
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {completedCount}/{totalCount}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {phase.steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
              phase.locked
                ? 'bg-gray-50 dark:bg-gray-900/50'
                : step.completed
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-gray-50 dark:bg-gray-900'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <span
                  className={`text-sm font-medium ${
                    step.completed
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {step.label}
                </span>
                {step.tooltip && !step.completed && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {step.tooltip}
                  </p>
                )}
              </div>
            </div>

            {!phase.locked && !step.completed && step.tutorialId && (
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTutorialClick(step.tutorialId!);
                  }}
                  title="Start tutorial"
                >
                  <BookOpen className="w-3 h-3" />
                  Tutorial
                </button>
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStepClick(step.link);
                  }}
                >
                  Go
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
