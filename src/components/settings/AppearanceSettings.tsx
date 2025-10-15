'use client';

import { useState } from 'react';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function AppearanceSettings(): JSX.Element {
  const { theme, setTheme } = useTheme();
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Appearance
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Customize the look and feel of your app
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-900 dark:text-green-100">
            {message.text}
          </p>
        </div>
      )}

      {/* Theme Selection */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
        <div className="mb-4 flex items-center gap-3">
          <Palette className="h-5 w-5 text-gray-700 dark:text-white/70" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Theme</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isActive = theme === themeOption.value;

            return (
              <button
                key={themeOption.value}
                onClick={() => handleThemeChange(themeOption.value)}
                className={cn(
                  'flex flex-col items-start gap-3 rounded-lg border-2 p-4 transition-all duration-200 hover:scale-105',
                  isActive
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20'
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg',
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/70'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {themeOption.label}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60 mt-1">
                    {themeOption.description}
                  </div>
                </div>

                {isActive && (
                  <div className="ml-auto">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Preview
        </h3>

        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Sample Email Sender
              </div>
              <div className="text-sm text-gray-600 dark:text-white/60">
                sender@example.com
              </div>
            </div>
          </div>

          <div>
            <div className="font-semibold text-gray-900 dark:text-white mb-2">
              Email Subject Line
            </div>
            <div className="text-sm text-gray-700 dark:text-white/80">
              This is a preview of how emails will look in your selected theme.
              The colors and contrast will adjust based on your preference.
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="primary">
              Primary Action
            </Button>
            <Button size="sm" variant="secondary">
              Secondary Action
            </Button>
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Advanced
        </h3>

        <div className="space-y-3 text-sm text-gray-700 dark:text-white/80">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-white/40" />
            <span>Glassmorphic design with backdrop blur effects</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-white/40" />
            <span>Smooth animations and transitions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-white/40" />
            <span>Primary accent color: #FF4C5A</span>
          </div>
        </div>
      </div>
    </div>
  );
}


