'use client';

import { useState } from 'react';
import { Sparkles, Zap, Filter } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateAIPreferences } from '@/lib/settings/actions';
import type { EmailSetting } from '@/db/schema';

interface AIPreferencesProps {
  settings: EmailSetting | null;
  accountId: string;
}

export function AIPreferences({
  settings,
  accountId,
}: AIPreferencesProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [data, setData] = useState({
    enableAiSummaries: settings?.enableAiSummaries ?? true,
    enableQuickReplies: settings?.enableQuickReplies ?? true,
    enableSmartActions: settings?.enableSmartActions ?? true,
    aiTone: settings?.aiTone || 'professional',
    autoClassifyAfterDays: settings?.autoClassifyAfterDays ?? 14,
    bulkEmailDetection: settings?.bulkEmailDetection ?? true,
    emailMode: settings?.emailMode || 'hey',
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await updateAIPreferences(accountId, data);

    if (result.success) {
      setMessage({ type: 'success', text: 'AI preferences updated!' });
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
          AI Preferences
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Configure AI-powered features and email screening
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
        {/* Email Mode */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Email Mode
            </h3>
          </div>

          <Select
            label="Email Workflow"
            value={data.emailMode}
            onChange={(e) =>
              setData({
                ...data,
                emailMode: e.target.value as 'traditional' | 'hey' | 'hybrid',
              })
            }
            options={[
              { value: 'traditional', label: 'Traditional (Inbox + Folders)' },
              { value: 'hey', label: 'Hey Mode (Imbox + Feed + Paper Trail)' },
              { value: 'hybrid', label: 'Hybrid (Best of Both)' },
            ]}
            helperText="Choose how you want to organize your emails"
          />

          <div className="mt-4 p-4 bg-gray-50/50 dark:bg-white/5 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-white/80 font-medium mb-2">
              {data.emailMode === 'traditional' && 'Traditional Mode'}
              {data.emailMode === 'hey' && 'Hey Mode (Recommended)'}
              {data.emailMode === 'hybrid' && 'Hybrid Mode'}
            </p>
            <p className="text-xs text-gray-600 dark:text-white/60">
              {data.emailMode === 'traditional' &&
                'Classic inbox with folders and labels. All emails go to inbox by default.'}
              {data.emailMode === 'hey' &&
                'Screen new senders and route emails to Imbox (important), Feed (newsletters), or Paper Trail (receipts/notifications).'}
              {data.emailMode === 'hybrid' &&
                'Combines inbox with Hey-style screening for new senders.'}
            </p>
          </div>
        </div>

        {/* AI Features */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              AI Features
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  AI Email Summaries
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  Get AI-generated summaries of long emails
                </div>
              </div>
              <Switch
                checked={data.enableAiSummaries}
                onCheckedChange={(checked) =>
                  setData({ ...data, enableAiSummaries: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Quick Reply Suggestions
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  AI-powered one-click reply options
                </div>
              </div>
              <Switch
                checked={data.enableQuickReplies}
                onCheckedChange={(checked) =>
                  setData({ ...data, enableQuickReplies: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Smart Actions
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  Contextual actions like calendar events, reminders
                </div>
              </div>
              <Switch
                checked={data.enableSmartActions}
                onCheckedChange={(checked) =>
                  setData({ ...data, enableSmartActions: checked })
                }
              />
            </div>

            <div className="pt-2">
              <Select
                label="AI Tone"
                value={data.aiTone}
                onChange={(e) => setData({ ...data, aiTone: e.target.value })}
                options={[
                  { value: 'professional', label: 'Professional' },
                  { value: 'casual', label: 'Casual' },
                  { value: 'friendly', label: 'Friendly' },
                  { value: 'formal', label: 'Formal' },
                ]}
                helperText="Tone for AI-generated replies"
              />
            </div>
          </div>
        </div>

        {/* Screening & Classification */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="mb-4 flex items-center gap-3">
            <Zap className="h-5 w-5 text-gray-700 dark:text-white/70" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Screening & Classification
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Bulk Email Detection
                </div>
                <div className="text-sm text-gray-600 dark:text-white/60">
                  Automatically detect and filter marketing emails
                </div>
              </div>
              <Switch
                checked={data.bulkEmailDetection}
                onCheckedChange={(checked) =>
                  setData({ ...data, bulkEmailDetection: checked })
                }
              />
            </div>

            <div className="pt-2">
              <Input
                label="Auto-classify after (days)"
                type="number"
                min="1"
                max="90"
                value={data.autoClassifyAfterDays}
                onChange={(e) =>
                  setData({
                    ...data,
                    autoClassifyAfterDays: parseInt(e.target.value),
                  })
                }
                helperText="Unscreened senders will be auto-classified after this many days"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save AI Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}


