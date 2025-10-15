'use client';

import { useState } from 'react';
import { Eye, Type } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateEmailPreferences } from '@/lib/settings/actions';
import type { EmailSetting } from '@/db/schema';

interface EmailPreferencesProps {
  settings: EmailSetting | null;
  accountId: string;
}

export function EmailPreferences({
  settings,
  accountId,
}: EmailPreferencesProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [data, setData] = useState({
    emailsPerPage: settings?.emailsPerPage ?? 50,
    density: settings?.density || 'comfortable',
    readingPanePosition: settings?.readingPanePosition || 'right',
    markAsReadDelay: settings?.markAsReadDelay ?? 0,
    defaultSendBehavior: settings?.defaultSendBehavior || 'send',
    defaultFontFamily: settings?.defaultFontFamily || 'sans-serif',
    defaultFontSize: settings?.defaultFontSize ?? 14,
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await updateEmailPreferences(accountId, data);

    if (result.success) {
      setMessage({ type: 'success', text: 'Email preferences updated!' });
    } else {
      setMessage({ type: 'error', text: result.error });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Email Preferences
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Customize how you view and interact with emails
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
        {/* Display Settings */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Display Settings
            </h3>
          </div>

          <div className="space-y-4">
            <Input
              label="Emails per page"
              type="number"
              min="10"
              max="100"
              value={data.emailsPerPage}
              onChange={(e) =>
                setData({ ...data, emailsPerPage: parseInt(e.target.value) })
              }
              helperText="Number of emails to show per page"
            />

            <Select
              label="List Density"
              value={data.density}
              onChange={(e) => setData({ ...data, density: e.target.value })}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'spacious', label: 'Spacious' },
              ]}
              helperText="How much space between emails in list view"
            />

            <Select
              label="Reading Pane Position"
              value={data.readingPanePosition}
              onChange={(e) =>
                setData({ ...data, readingPanePosition: e.target.value })
              }
              options={[
                { value: 'right', label: 'Right' },
                { value: 'bottom', label: 'Bottom' },
                { value: 'off', label: 'Off' },
              ]}
              helperText="Where to display email content"
            />

            <Input
              label="Mark as read delay (seconds)"
              type="number"
              min="0"
              max="10"
              value={data.markAsReadDelay}
              onChange={(e) =>
                setData({ ...data, markAsReadDelay: parseInt(e.target.value) })
              }
              helperText="Delay before marking email as read (0 = immediately)"
            />
          </div>
        </div>

        {/* Composer Settings */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Type className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Composer Settings
            </h3>
          </div>

          <div className="space-y-4">
            <Select
              label="Default Font Family"
              value={data.defaultFontFamily}
              onChange={(e) =>
                setData({ ...data, defaultFontFamily: e.target.value })
              }
              options={[
                { value: 'sans-serif', label: 'Sans Serif' },
                { value: 'serif', label: 'Serif' },
                { value: 'monospace', label: 'Monospace' },
              ]}
            />

            <Input
              label="Default Font Size"
              type="number"
              min="10"
              max="24"
              value={data.defaultFontSize}
              onChange={(e) =>
                setData({ ...data, defaultFontSize: parseInt(e.target.value) })
              }
              helperText="Font size in pixels"
            />

            <Select
              label="Default Send Behavior"
              value={data.defaultSendBehavior}
              onChange={(e) =>
                setData({ ...data, defaultSendBehavior: e.target.value })
              }
              options={[
                { value: 'send', label: 'Send' },
                { value: 'send_and_archive', label: 'Send and Archive' },
                { value: 'schedule', label: 'Schedule Send' },
              ]}
              helperText="What happens when you click send"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Email Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
