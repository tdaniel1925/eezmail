'use client';

import { X, Sparkles } from 'lucide-react';

interface AIActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailId: string;
}

export function AIActionsModal({
  isOpen,
  onClose,
  emailId,
}: AIActionsModalProps): JSX.Element | null {
  if (!isOpen) return null;

  const handleAction = (action: string): void => {
    console.log(`AI Action: ${action} for email ${emailId}`);
    // TODO: Implement actual AI actions via API
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Popup Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-t-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white">
                  AI Actions
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Let AI help you with this email
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* AI Actions */}
        <div className="p-3">
          <button
            onClick={() => handleAction('summarize')}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/60 transition-colors">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  Summarize Email
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get a quick summary of key points
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAction('draft-reply')}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 transition-colors">
                <span className="text-xl">💬</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  Draft Reply
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Generate a professional response
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAction('extract-actions')}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 dark:group-hover:bg-green-800/60 transition-colors">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  Extract Action Items
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Find tasks and deadlines
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAction('translate')}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/60 transition-colors">
                <span className="text-xl">🌐</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  Translate
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Convert to another language
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAction('analyze-tone')}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/40 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-pink-200 dark:group-hover:bg-pink-800/60 transition-colors">
                <span className="text-xl">😊</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  Analyze Tone
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Understand sender&apos;s sentiment
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Powered by AI • Results may vary
          </p>
        </div>
      </div>
    </div>
  );
}


