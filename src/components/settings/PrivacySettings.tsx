'use client';

import { useState } from 'react';
import { Shield, Eye, Link as LinkIcon, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { updatePrivacySettings } from '@/lib/settings/actions';
import { InlineNotification } from '@/components/ui/inline-notification';
import type { EmailSetting } from '@/db/schema';
import { useUnsavedChanges, StickySaveBar } from '@/hooks/useUnsavedChanges';

interface PrivacySettingsProps {
  settings: EmailSetting | null;
  accountId: string;
}

export function PrivacySettings({
  settings,
  accountId,
}: PrivacySettingsProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const { hasUnsavedChanges, setHasUnsavedChanges, resetUnsavedChanges } =
    useUnsavedChanges();

  const [data, setData] = useState({
    blockTrackers: settings?.blockTrackers ?? true,
    blockExternalImages: settings?.blockExternalImages ?? false,
    stripUtmParameters: settings?.stripUtmParameters ?? true,
  });

  const handleDataChange = (updates: Partial<typeof data>) => {
    setData((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
    // Clear notification when user makes changes
    setNotification(null);
  };

  const handleSubmit = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    try {
      const result = await updatePrivacySettings(accountId, data);

      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Privacy settings updated successfully!',
        });
        resetUnsavedChanges();
        
        // Auto-dismiss success message after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to update privacy settings',
        });
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      setNotification({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.',
      });
    }

    setIsSubmitting(false);
  };

  const handleDiscard = () => {
    setData({
      blockTrackers: settings?.blockTrackers ?? true,
      blockExternalImages: settings?.blockExternalImages ?? false,
      stripUtmParameters: settings?.stripUtmParameters ?? true,
    });
    resetUnsavedChanges();
    setNotification(null);
  };

  const handlePrivacyPolicyClick = () => {
    // Open privacy policy in new tab
    window.open('/privacy-policy', '_blank');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Security & Privacy
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Manage your privacy and security preferences
        </p>
      </div>

      {/* Inline Notification */}
      {notification && (
        <InlineNotification
          type={notification.type}
          message={notification.message}
          onDismiss={() => setNotification(null)}
        />
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
                  Blocks invisible tracking pixels that monitor when and how many times you open emails
                </div>
              </div>
              <Switch
                checked={data.blockTrackers}
                onCheckedChange={(checked) =>
                  handleDataChange({ blockTrackers: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Strip UTM parameters
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  Removes tracking codes from links (utm_source, utm_campaign, etc.) to prevent ad tracking
                </div>
              </div>
              <Switch
                checked={data.stripUtmParameters}
                onCheckedChange={(checked) =>
                  handleDataChange({ stripUtmParameters: checked })
                }
              />
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-1">
                🛡️ How tracking protection works
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Marketers embed invisible 1x1 pixel images in emails. When you open the email, the pixel loads from their server, telling them you opened it, your location, device type, and more. We block these pixels to protect your privacy.
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
                  handleDataChange({ blockExternalImages: checked })
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

        {/* Read Receipts - Info Only */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <LinkIcon className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Read Receipts
            </h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                    Read receipts are disabled by default
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-200">
                    We protect your privacy by never sending read receipts to senders. They cannot track when or if you&apos;ve opened their emails.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-1">
                    Your privacy matters
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Combined with tracking pixel blocking, senders have no way to know if you&apos;ve read their emails. You maintain complete control over your reading habits.
                  </p>
                </div>
              </div>
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
            <button
              type="button"
              onClick={handlePrivacyPolicyClick}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
            >
              <span>View Privacy Policy</span>
              <ExternalLink className="h-4 w-4" />
            </button>
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
