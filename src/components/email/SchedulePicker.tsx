'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, X } from 'lucide-react';

interface SchedulePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
}

// Preset schedule options
const getPresets = () => {
  const now = new Date();
  const presets = [];

  // Tomorrow morning (9 AM)
  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(9, 0, 0, 0);
  presets.push({
    label: 'Tomorrow morning',
    sublabel: formatDateTime(tomorrowMorning),
    date: tomorrowMorning,
  });

  // Tomorrow afternoon (2 PM)
  const tomorrowAfternoon = new Date(now);
  tomorrowAfternoon.setDate(tomorrowAfternoon.getDate() + 1);
  tomorrowAfternoon.setHours(14, 0, 0, 0);
  presets.push({
    label: 'Tomorrow afternoon',
    sublabel: formatDateTime(tomorrowAfternoon),
    date: tomorrowAfternoon,
  });

  // Next Monday (9 AM)
  const nextMonday = new Date(now);
  const dayOfWeek = nextMonday.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(9, 0, 0, 0);
  presets.push({
    label: 'Next Monday',
    sublabel: formatDateTime(nextMonday),
    date: nextMonday,
  });

  // This evening (6 PM)
  const thisEvening = new Date(now);
  thisEvening.setHours(18, 0, 0, 0);
  if (thisEvening > now) {
    presets.unshift({
      label: 'This evening',
      sublabel: formatDateTime(thisEvening),
      date: thisEvening,
    });
  }

  return presets;
};

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export function SchedulePicker({
  isOpen,
  onClose,
  onSchedule,
}: SchedulePickerProps) {
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [presets] = useState(getPresets());

  // Set default custom date/time to tomorrow at 9 AM
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const dateStr = tomorrow.toISOString().split('T')[0];
      const timeStr = '09:00';

      setCustomDate(dateStr);
      setCustomTime(timeStr);
    }
  }, [isOpen]);

  const handlePresetClick = (date: Date) => {
    onSchedule(date);
    onClose();
  };

  const handleCustomSchedule = () => {
    if (!customDate || !customTime) {
      return;
    }

    const [year, month, day] = customDate.split('-').map(Number);
    const [hours, minutes] = customTime.split(':').map(Number);

    const scheduledDate = new Date(year, month - 1, day, hours, minutes);

    if (scheduledDate <= new Date()) {
      alert('Scheduled time must be in the future');
      return;
    }

    onSchedule(scheduledDate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[10000]"
        onClick={onClose}
      />

      {/* Picker Popover */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[10001]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Schedule Send
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Presets */}
        <div className="p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick schedule
          </h4>
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetClick(preset.date)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Clock size={16} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {preset.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {preset.sublabel}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Date/Time */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom schedule
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {/* Date Input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Time Input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Schedule Button */}
          <button
            onClick={handleCustomSchedule}
            disabled={!customDate || !customTime}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Clock size={16} />
            Schedule for{' '}
            {customDate &&
              customTime &&
              formatDateTime(new Date(`${customDate}T${customTime}`))}
          </button>
        </div>
      </div>
    </>
  );
}
