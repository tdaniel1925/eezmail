'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Settings,
  X,
  ChevronRight,
  Sparkles,
  MessageSquare,
  BarChart3,
  Search,
  Zap,
} from 'lucide-react';

export function SimpleAIAssistantPanel(): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isVisible) {
    console.log(
      'SimpleAIAssistantPanel: Not rendering - mounted:',
      mounted,
      'isVisible:',
      isVisible
    );
    return <></>;
  }

  console.log(
    'SimpleAIAssistantPanel: Rendering panel - isExpanded:',
    isExpanded
  );

  return (
    <motion.aside
      animate={{ width: isExpanded ? 380 : 48 }}
      transition={{ duration: 0.2 }}
      className="relative flex flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      style={{
        minWidth: isExpanded ? 320 : 48,
        maxWidth: isExpanded ? 600 : 48,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        {isExpanded ? (
          <>
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                AI Assistant
              </h2>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {}}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Bot className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Email Insights Section */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Email Insights
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select an email to see AI-powered analysis and summary.
                </p>
              </div>

              {/* Quick Actions Section */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Zap className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Quick Actions
                  </h3>
                </div>
                <div className="space-y-2">
                  <button className="w-full rounded-md bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
                    Reply
                  </button>
                  <button className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    Archive
                  </button>
                </div>
              </div>

              {/* Analytics Section */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex items-center space-x-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Analytics
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sender stats and email patterns will appear here.
                </p>
              </div>

              {/* Research Section */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Search className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Research
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Related emails and context will appear here.
                </p>
              </div>

              {/* Chat Interface Section */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Chat Interface
                  </h3>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Ask me anything about your emails..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <button className="w-full rounded-md bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
