'use client';

import { useState } from 'react';
import { Palette, Sun, Moon, Monitor, Eye, Type } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { updateEmailPreferences } from '@/lib/settings/actions';
import type { EmailSetting } from '@/db/schema';
import { useUnsavedChanges, StickySaveBar } from '@/hooks/useUnsavedChanges';

interface DisplaySettingsProps {
  settings: EmailSetting | null;
  accountId: string;
}

export function DisplaySettings({
  settings,
  accountId,
}: DisplaySettingsProps): JSX.Element {
  const { theme, setTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { hasUnsavedChanges, setHasUnsavedChanges, resetUnsavedChanges } =
    useUnsavedChanges();

  const [data, setData] = useState({
    emailsPerPage: settings?.emailsPerPage ?? 50,
    density: settings?.density || 'comfortable',
    readingPanePosition: settings?.readingPanePosition || 'right',
    markAsReadDelay: settings?.markAsReadDelay ?? 0,
    defaultFontFamily: settings?.defaultFontFamily || 'sans-serif',
    defaultFontSize: settings?.defaultFontSize ?? 14,
  });

  const themes = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Light theme with bright colors',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Dark theme for low-light environments',
    },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Match your system preferences',
    },
  ];

  const handleThemeChange = (newTheme: string): void => {
    setTheme(newTheme);
    setMessage({
      type: 'success',
      text: `Theme changed to ${newTheme}`,
    });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDataChange = (updates: Partial<typeof data>) => {
    setData((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await updateEmailPreferences(accountId, data);

    if (result.success) {
      setMessage({ type: 'success', text: 'Display settings updated!' });
      resetUnsavedChanges();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update' });
    }

    setIsSubmitting(false);
  };

  const handleDiscard = () => {
    setData({
      emailsPerPage: settings?.emailsPerPage ?? 50,
      density: settings?.density || 'comfortable',
      readingPanePosition: settings?.readingPanePosition || 'right',
      markAsReadDelay: settings?.markAsReadDelay ?? 0,
      defaultFontFamily: settings?.defaultFontFamily || 'sans-serif',
      defaultFontSize: settings?.defaultFontSize ?? 14,
    });
    resetUnsavedChanges();
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Display Settings
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Customize how your emails and interface look
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === 'success'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100'
              : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Theme Selection */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Palette className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Theme
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.value;

              return (
                <button
                  key={themeOption.value}
                  type="button"
                  onClick={() => handleThemeChange(themeOption.value)}
                  className={cn(
                    'flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all',
                    isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                  )}
                >
                  <Icon className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {themeOption.label}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {themeOption.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Email List Display */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Email List
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Emails per page
              </label>
              <select
                value={data.emailsPerPage}
                onChange={(e) =>
                  handleDataChange({ emailsPerPage: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-900 dark:text-white"
              >
                <option value={25}>25 emails</option>
                <option value={50}>50 emails</option>
                <option value={100}>100 emails</option>
                <option value={200}>200 emails</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Density
              </label>
              <select
                value={data.density}
                onChange={(e) =>
                  handleDataChange({
                    density: e.target.value as 'compact' | 'comfortable' | 'relaxed',
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-900 dark:text-white"
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reading pane position
              </label>
              <select
                value={data.readingPanePosition}
                onChange={(e) =>
                  handleDataChange({
                    readingPanePosition: e.target.value as 'right' | 'bottom' | 'hidden',
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-900 dark:text-white"
              >
                <option value="right">Right side</option>
                <option value="bottom">Bottom</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mark as read delay
              </label>
              <select
                value={data.markAsReadDelay}
                onChange={(e) =>
                  handleDataChange({ markAsReadDelay: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-900 dark:text-white"
              >
                <option value={0}>Immediately</option>
                <option value={1000}>After 1 second</option>
                <option value={3000}>After 3 seconds</option>
                <option value={5000}>After 5 seconds</option>
              </select>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Type className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Typography
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Font family
              </label>
              <select
                value={data.defaultFontFamily}
                onChange={(e) =>
                  handleDataChange({ defaultFontFamily: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-900 dark:text-white"
              >
                <option value="sans-serif">Sans Serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Font size
              </label>
              <select
                value={data.defaultFontSize}
                onChange={(e) =>
                  handleDataChange({ defaultFontSize: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-900 dark:text-white"
              >
                <option value={12}>Small (12px)</option>
                <option value={14}>Medium (14px)</option>
                <option value={16}>Large (16px)</option>
                <option value={18}>Extra Large (18px)</option>
              </select>
            </div>
          </div>
        </div>
      </form>

      {/* Sticky Save Bar */}
      <StickySaveBar
        show={hasUnsavedChanges}
        onSave={handleSubmit}
        onDiscard={handleDiscard}
        isSaving={isSubmitting}
      />
    </div>
  );
}

