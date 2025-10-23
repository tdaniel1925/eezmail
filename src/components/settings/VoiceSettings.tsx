'use client';

import { useState } from 'react';
import { Mic, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useUnsavedChanges, StickySaveBar } from '@/hooks/useUnsavedChanges';

interface VoiceSettingsData {
  enableVoiceMessages: boolean;
  maxDuration: number;
}

const DEFAULT_SETTINGS: VoiceSettingsData = {
  enableVoiceMessages: true,
  maxDuration: 10, // 10 minutes
};

export function VoiceSettings(): JSX.Element {
  const [settings, setSettings] = useState<VoiceSettingsData>(DEFAULT_SETTINGS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { hasUnsavedChanges, setHasUnsavedChanges, resetUnsavedChanges } =
    useUnsavedChanges();

  const handleChange = (updates: Partial<VoiceSettingsData>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // TODO: Implement server action to save voice settings
    // For now, simulate save
    await new Promise((resolve) => setTimeout(resolve, 500));

    setMessage({
      type: 'success',
      text: 'Voice settings updated successfully!',
    });
    resetUnsavedChanges();
    setIsSubmitting(false);

    setTimeout(() => setMessage(null), 3000);
  };

  const handleDiscard = () => {
    setSettings(DEFAULT_SETTINGS);
    resetUnsavedChanges();
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Voice Messages
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Configure voice message recording and playback
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
        {/* Enable Voice Messages */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Mic className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Recording
            </h4>
          </div>

          <div className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable voice messages
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Allow recording and sending voice messages in emails
                </p>
              </div>
              <Switch
                checked={settings.enableVoiceMessages}
                onCheckedChange={(checked) =>
                  handleChange({ enableVoiceMessages: checked })
                }
              />
            </div>

            {/* Max Duration */}
            {settings.enableVoiceMessages && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Maximum recording duration
                </label>
                <select
                  value={settings.maxDuration}
                  onChange={(e) =>
                    handleChange({ maxDuration: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-900 dark:text-white"
                >
                  <option value={1}>1 minute</option>
                  <option value={3}>3 minutes</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Longer recordings will result in larger file sizes
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                How voice messages work
              </h4>
              <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Click the microphone icon in the composer to record</li>
                <li>• Voice messages are compressed for optimal storage</li>
                <li>• Recipients can play messages directly in email</li>
                <li>• All recordings are encrypted and secure</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Browser Compatibility Note */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/20 p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Note:</strong> Voice recording requires a modern browser
            with microphone permissions. Chrome, Firefox, Safari, and Edge are
            all supported. Make sure to allow microphone access when prompted.
          </p>
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
