'use client';

import { X, Sparkles } from 'lucide-react';
import { AISummaryBox } from './AISummaryBox';
import type { Email } from '@/db/schema';

interface AIAnalysisModalProps {
  email: Email | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AIAnalysisModal({
  email,
  isOpen,
  onClose,
}: AIAnalysisModalProps): JSX.Element | null {
  if (!isOpen || !email) return null;

  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Email Analysis
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Intelligent insights and suggested actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Email Summary */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Email Details
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">From:</span>{' '}
                <span className="text-gray-900 dark:text-white font-medium">
                  {email.fromAddress?.name || email.fromAddress?.email}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Subject:
                </span>{' '}
                <span className="text-gray-900 dark:text-white">
                  {email.subject || '(No subject)'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Received:
                </span>{' '}
                <span className="text-gray-900 dark:text-white">
                  {new Date(email.receivedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {email.aiSummary ? (
            <AISummaryBox
              summary={email.aiSummary}
              quickReplies={email.aiQuickReplies || []}
            />
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    AI Analysis Available
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Click "Generate AI Summary" to analyze this email with AI.
                    You'll get:
                  </p>
                  <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Key points and action items</li>
                    <li>Sentiment analysis</li>
                    <li>Suggested quick replies</li>
                    <li>Smart action recommendations</li>
                  </ul>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Generate AI Summary
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Smart Actions */}
          {email.aiSmartActions && email.aiSmartActions.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Suggested Actions
              </h3>
              <div className="space-y-2">
                {email.aiSmartActions.map((action: any, index: number) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {action.label || action.type}
                    </div>
                    {action.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {action.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Replies */}
          {email.aiQuickReplies && email.aiQuickReplies.length > 0 && (
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Quick Reply Suggestions
              </h3>
              <div className="space-y-2">
                {email.aiQuickReplies.map((reply: string, index: number) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 bg-white dark:bg-white/5 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm text-gray-700 dark:text-gray-300"
                  >
                    "{reply}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Email Classification */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/10">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Category
              </div>
              <div className="font-medium text-gray-900 dark:text-white capitalize">
                {email.emailCategory || 'Unscreened'}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/10">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Priority
              </div>
              <div className="font-medium text-gray-900 dark:text-white capitalize">
                {email.aiPriority || 'Normal'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Take Action
          </button>
        </div>
      </div>
    </div>
  );
}
