'use client';

interface Props {
  percent: number;
  completedSteps: number;
  totalSteps: number;
}

export function ProgressTracker({
  percent,
  completedSteps,
  totalSteps,
}: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Progress
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {completedSteps} of {totalSteps} steps complete
          </p>
        </div>
        <div className="text-3xl font-bold text-primary">{percent}%</div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

