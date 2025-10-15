'use client';

import { useState } from 'react';
import { Shield, Eye, Link } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { updatePrivacySettings } from '@/lib/settings/actions';
import type { EmailSetting } from '@/db/schema';

interface PrivacySettingsProps {
  settings: EmailSetting | null;
  accountId: string;
}

export function PrivacySettings({
  settings,
  accountId,
}: PrivacySettingsProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [data, setData] = useState({
    blockTrackers: settings?.blockTrackers ?? true,
    blockExternalImages: settings?.blockExternalImages ?? false,
    stripUtmParameters: settings?.stripUtmParameters ?? true,
    enableReadReceipts: false,
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await updatePrivacySettings(accountId, data);

    if (result.success) {
      setMessage({ type: 'success', text: 'Privacy settings updated!' });
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
          Security & Privacy
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Manage your privacy and security preferences
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
        {/* Tracking Protection */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Tracking Protection
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Block email trackers
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  Prevent senders from tracking when you open emails
                </div>
              </div>
              <Switch
                checked={data.blockTrackers}
                onCheckedChange={(checked) =>
                  setData({ ...data, blockTrackers: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Strip UTM parameters
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  Remove tracking parameters from links
                </div>
              </div>
              <Switch
                checked={data.stripUtmParameters}
                onCheckedChange={(checked) =>
                  setData({ ...data, stripUtmParameters: checked })
                }
              />
            </div>

            <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-lg">
              <p className="text-xs text-gray-700 dark:text-white/80">
                <strong>Note:</strong> Email trackers use invisible pixels to
                monitor when you open emails. Blocking them helps protect your
                privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Image Loading */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Image Loading
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Block external images
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  Don&apos;t automatically load images from unknown senders
                </div>
              </div>
              <Switch
                checked={data.blockExternalImages}
                onCheckedChange={(checked) =>
                  setData({ ...data, blockExternalImages: checked })
                }
              />
            </div>

            <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-lg">
              <p className="text-xs text-gray-700 dark:text-white/80">
                External images can be used for tracking. You can still load
                them manually when viewing individual emails.
              </p>
            </div>
          </div>
        </div>

        {/* Read Receipts */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Link className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Read Receipts
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Send read receipts
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  Let senders know when you&apos;ve read their emails
                </div>
              </div>
              <Switch
                checked={data.enableReadReceipts}
                onCheckedChange={(checked) =>
                  setData({ ...data, enableReadReceipts: checked })
                }
              />
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Recommended:</strong> Keep this disabled to maintain
                your privacy and control over your reading habits.
              </p>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Data & Privacy
          </h3>

          <div className="space-y-3 text-sm text-gray-700 dark:text-white/80">
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-white/40 mt-1.5" />
              <span>Your emails are encrypted in transit and at rest</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-white/40 mt-1.5" />
              <span>
                AI processing happens securely and your data is never used for
                training
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-white/40 mt-1.5" />
              <span>
                We use industry-standard security practices to protect your
                information
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
            <Button variant="ghost" size="sm">
              View Privacy Policy →
            </Button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Privacy Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
