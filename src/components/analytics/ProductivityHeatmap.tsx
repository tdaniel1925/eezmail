'use client';

import { cn } from '@/lib/utils';

interface HeatmapData {
  hour: number;
  day: string;
  count: number;
}

interface ProductivityHeatmapProps {
  data: HeatmapData[];
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, i) => i);

export function ProductivityHeatmap({ data }: ProductivityHeatmapProps) {
  // Find max count for color scaling
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getCount = (day: string, hour: number) => {
    const entry = data.find((d) => d.day === day && d.hour === hour);
    return entry?.count || 0;
  };

  const getIntensity = (count: number) => {
    const intensity = count / maxCount;
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity < 0.2) return 'bg-blue-200 dark:bg-blue-900/40';
    if (intensity < 0.4) return 'bg-blue-300 dark:bg-blue-800/60';
    if (intensity < 0.6) return 'bg-blue-400 dark:bg-blue-700/80';
    if (intensity < 0.8) return 'bg-blue-500 dark:bg-blue-600';
    return 'bg-blue-600 dark:bg-blue-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Email Activity Heatmap
      </h3>
      <div className="space-y-2">
        <div className="flex gap-2 mb-2">
          <div className="w-12"></div>
          {[0, 6, 12, 18, 23].map((hour) => (
            <div
              key={hour}
              className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400"
            >
              {hour}:00
            </div>
          ))}
        </div>
        {days.map((day) => (
          <div key={day} className="flex gap-2">
            <div className="w-12 flex items-center text-xs font-medium text-gray-600 dark:text-gray-400">
              {day}
            </div>
            {hours.map((hour) => {
              const count = getCount(day, hour);
              return (
                <div
                  key={`${day}-${hour}`}
                  className={cn(
                    'flex-1 h-6 rounded transition-colors cursor-pointer hover:ring-2 hover:ring-blue-400',
                    getIntensity(count)
                  )}
                  title={`${day} ${hour}:00 - ${count} emails`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Less activity
        </span>
        <div className="flex gap-1">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
            <div
              key={i}
              className={cn(
                'w-4 h-4 rounded',
                getIntensity(intensity * maxCount)
              )}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          More activity
        </span>
      </div>
    </div>
  );
}
