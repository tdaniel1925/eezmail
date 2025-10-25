'use client';

import {
  Bot,
  Sparkles,
  Mail,
  MessageSquare,
  FileText,
  CheckSquare,
  Users,
} from 'lucide-react';

export type EmptyStateType = 'chat' | 'chat-with-email' | 'insights' | 'people';

interface EmptyStateProps {
  type: EmptyStateType;
  emailFrom?: string;
  onActionClick?: (action: string) => void;
}

export function EmptyState({
  type,
  emailFrom,
  onActionClick,
}: EmptyStateProps): JSX.Element {
  if (type === 'chat-with-email') {
    return (
      <div className="p-6 space-y-4">
        {/* Context indicator */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
              Viewing email {emailFrom && `from ${emailFrom}`}
            </p>
          </div>
        </div>

        {/* Quick action chips */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onActionClick?.('summarize')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Summarize</span>
            </button>
            <button
              onClick={() => onActionClick?.('reply')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Draft Reply</span>
            </button>
            <button
              onClick={() => onActionClick?.('actions')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary transition-colors"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Extract Actions</span>
            </button>
          </div>
        </div>

        {/* Help text */}
        <div className="pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Or ask me anything about this email...
          </p>
        </div>
      </div>
    );
  }

  if (type === 'people') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 mb-4">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Email Selected
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Select an email to view sender details and previous conversations
        </p>
      </div>
    );
  }

  if (type === 'insights') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
          <FileText className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Email Selected
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Select an email to view AI-powered insights including summaries, key
          points, and action items
        </p>
      </div>
    );
  }

  // Default: chat empty state
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
        <Bot className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Hi! I'm your AI Assistant
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Select an email and I'll help you:
      </p>
      <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <li className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <span>Summarize long conversations</span>
        </li>
        <li className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <span>Draft quick replies</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <span>Extract action items</span>
        </li>
        <li className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <span>Answer questions</span>
        </li>
      </ul>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
        Or ask me anything about your inbox!
      </p>
    </div>
  );
}
