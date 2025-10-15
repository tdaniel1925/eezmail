'use client';

import { useState } from 'react';
import { Bell, Volume2, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { updateNotificationPreferences } from '@/lib/settings/actions';
import type { EmailSetting } from '@/db/schema';

interface NotificationSettingsProps {
  settings: EmailSetting | null;
  accountId: string;
}

export function NotificationSettings({
  settings,
  accountId,
}: NotificationSettingsProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [data, setData] = useState({
    desktopNotifications: settings?.desktopNotifications ?? true,
    soundEnabled: settings?.soundEnabled ?? false,
    notifyOnImportantOnly: settings?.notifyOnImportantOnly ?? false,
    notifyOnImbox: true,
    notifyOnFeed: false,
    notifyOnPaperTrail: false,
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await updateNotificationPreferences(accountId, data);

    if (result.success) {
      setMessage({
        type: 'success',
        text: 'Notification preferences updated!',
      });
    } else {
      setMessage({ type: 'error', text: result.error });
    }

    setIsSubmitting(false);
  };

  const requestNotificationPermission = async (): Promise<void> => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setMessage({
          type: 'success',
          text: 'Notifications enabled!',
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Notification permission denied',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Manage how you receive notifications
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

      {/* Browser Permission Notice */}
      {typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'default' && (
          <div className="rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                  Enable browser notifications
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200 mb-3">
                  To receive desktop notifications, you need to grant permission
                  in your browser.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={requestNotificationPermission}
                >
                  Enable Notifications
                </Button>
              </div>
            </div>
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Notifications */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Email Notifications
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Desktop Notifications
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  Show desktop notifications for new emails
                </div>
              </div>
              <Switch
                checked={data.desktopNotifications}
                onCheckedChange={(checked) =>
                  setData({ ...data, desktopNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Important emails only
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  Only notify for high-priority or starred emails
                </div>
              </div>
              <Switch
                checked={data.notifyOnImportantOnly}
                onCheckedChange={(checked) =>
                  setData({ ...data, notifyOnImportantOnly: checked })
                }
                disabled={!data.desktopNotifications}
              />
            </div>
          </div>
        </div>

        {/* Category Notifications */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Notify by Category
            </h4>
            <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
              Choose which email categories trigger notifications
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Imbox
                </div>
                <div className="text-xs text-gray-600 dark:text-white/60">
                  Important emails that need attention
                </div>
              </div>
              <Switch
                checked={data.notifyOnImbox}
                onCheckedChange={(checked) =>
                  setData({ ...data, notifyOnImbox: checked })
                }
                disabled={!data.desktopNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Feed
                </div>
                <div className="text-xs text-gray-600 dark:text-white/60">
                  Newsletters and updates to read later
                </div>
              </div>
              <Switch
                checked={data.notifyOnFeed}
                onCheckedChange={(checked) =>
                  setData({ ...data, notifyOnFeed: checked })
                }
                disabled={!data.desktopNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Paper Trail
                </div>
                <div className="text-xs text-gray-600 dark:text-white/60">
                  Receipts and transactional emails
                </div>
              </div>
              <Switch
                checked={data.notifyOnPaperTrail}
                onCheckedChange={(checked) =>
                  setData({ ...data, notifyOnPaperTrail: checked })
                }
                disabled={!data.desktopNotifications}
              />
            </div>
          </div>
        </div>

        {/* Sound Settings */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Sound
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Notification sound
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  Play a sound when new emails arrive
                </div>
              </div>
              <Switch
                checked={data.soundEnabled}
                onCheckedChange={(checked) =>
                  setData({ ...data, soundEnabled: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Notification Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}


