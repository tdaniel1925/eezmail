'use client';

import { useState } from 'react';
import { Mail, Eye, Type, Clock, Reply, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ReadingComposingPrefsProps {
  preferences: any;
}

export function ReadingComposingPrefs({
  preferences,
}: ReadingComposingPrefsProps): JSX.Element {
  const [data, setData] = useState({
    emailsPerPage: preferences?.emailsPerPage ?? 50,
    markAsReadDelay: preferences?.markAsReadDelay ?? 0,
    showImagesAutomatically: preferences?.showImagesAutomatically ?? false,
    enableReadingPane: preferences?.enableReadingPane ?? true,
    readingPanePosition: preferences?.readingPanePosition ?? 'right',
    conversationView: preferences?.conversationView ?? true,
    // Composer settings
    defaultFontFamily: preferences?.defaultFontFamily ?? 'sans-serif',
    defaultFontSize: preferences?.defaultFontSize ?? 14,
    defaultSendBehavior: preferences?.defaultSendBehavior ?? 'send',
    enableSpellCheck: preferences?.enableSpellCheck ?? true,
    enableAutoCorrect: preferences?.enableAutoCorrect ?? false,
    enableSmartCompose: preferences?.enableSmartCompose ?? true,
    replyQuoteOriginal: preferences?.replyQuoteOriginal ?? true,
    replyPosition: preferences?.replyPosition ?? 'above',
    defaultReplyAll: preferences?.defaultReplyAll ?? false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      // TODO: Save to server
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Reading & composing preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reading & Composing
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Control how you read and write emails
        </p>
      </div>

      {/* Reading Settings */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-white/10 pb-3">
          <Eye className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Reading Settings
          </h3>
        </div>

        <div className="space-y-4">
          {/* Emails per page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emails per page
            </label>
            <select
              value={data.emailsPerPage}
              onChange={(e) =>
                setData({ ...data, emailsPerPage: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Number of emails to display per page
            </p>
          </div>

          {/* Mark as read delay */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mark as read delay
            </label>
            <select
              value={data.markAsReadDelay}
              onChange={(e) =>
                setData({ ...data, markAsReadDelay: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value={0}>Immediately</option>
              <option value={1}>After 1 second</option>
              <option value={2}>After 2 seconds</option>
              <option value={3}>After 3 seconds</option>
              <option value={5}>After 5 seconds</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              How long to wait before marking an email as read
            </p>
          </div>

          {/* Show images automatically */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show images automatically
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Automatically load images in emails
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setData({
                  ...data,
                  showImagesAutomatically: !data.showImagesAutomatically,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                data.showImagesAutomatically
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  data.showImagesAutomatically
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          {/* Reading pane position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reading pane position
            </label>
            <select
              value={data.readingPanePosition}
              onChange={(e) =>
                setData({ ...data, readingPanePosition: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="right">Right</option>
              <option value="bottom">Bottom</option>
              <option value="off">Off</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Where to display the email reading pane
            </p>
          </div>

          {/* Conversation view */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Conversation view
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Group related emails together
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setData({ ...data, conversationView: !data.conversationView })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                data.conversationView
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  data.conversationView ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Composing Settings */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-white/10 pb-3">
          <Type className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Composing Settings
          </h3>
        </div>

        <div className="space-y-4">
          {/* Font family */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default font
            </label>
            <select
              value={data.defaultFontFamily}
              onChange={(e) =>
                setData({ ...data, defaultFontFamily: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="sans-serif">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
              <option value="arial">Arial</option>
              <option value="times">Times New Roman</option>
              <option value="courier">Courier New</option>
            </select>
          </div>

          {/* Font size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default font size
            </label>
            <select
              value={data.defaultFontSize}
              onChange={(e) =>
                setData({ ...data, defaultFontSize: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value={10}>10px</option>
              <option value={12}>12px</option>
              <option value={14}>14px (Default)</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={20}>20px</option>
            </select>
          </div>

          {/* Send behavior */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              After sending
            </label>
            <select
              value={data.defaultSendBehavior}
              onChange={(e) =>
                setData({ ...data, defaultSendBehavior: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="send">Just send</option>
              <option value="send_and_archive">Send and archive</option>
              <option value="send_and_next">Send and go to next</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              What happens after you send an email
            </p>
          </div>

          {/* Spell check */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable spell check
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Check spelling as you type
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setData({ ...data, enableSpellCheck: !data.enableSpellCheck })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                data.enableSpellCheck
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  data.enableSpellCheck ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          {/* Smart compose */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Smart compose
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                AI-powered writing suggestions
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setData({
                  ...data,
                  enableSmartCompose: !data.enableSmartCompose,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                data.enableSmartCompose
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  data.enableSmartCompose ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Reply Settings */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-white/10 pb-3">
          <Reply className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Reply Settings
          </h3>
        </div>

        <div className="space-y-4">
          {/* Quote original */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quote original message
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Include original message when replying
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setData({
                  ...data,
                  replyQuoteOriginal: !data.replyQuoteOriginal,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                data.replyQuoteOriginal
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  data.replyQuoteOriginal ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          {/* Reply position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reply position
            </label>
            <select
              value={data.replyPosition}
              onChange={(e) =>
                setData({ ...data, replyPosition: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="above">Above quoted text</option>
              <option value="below">Below quoted text</option>
            </select>
          </div>

          {/* Default reply all */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reply All by default
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Always reply to all recipients
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setData({ ...data, defaultReplyAll: !data.defaultReplyAll })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                data.defaultReplyAll
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  data.defaultReplyAll ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </>
          ) : (
            <>
              <Send size={16} />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}

