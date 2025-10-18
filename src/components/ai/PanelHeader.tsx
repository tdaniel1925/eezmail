'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PanelHeaderProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}

export function PanelHeader({
  isExpanded,
  onToggleExpand,
  onClose,
}: PanelHeaderProps): JSX.Element {
  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
      {isExpanded ? (
        <>
          {/* Expanded Header */}
          <div className="flex items-center space-x-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-pink-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                AI Assistant
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contextual help
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onToggleExpand}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Collapse"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Collapsed Header - Icon Bar */}
          <button
            onClick={onToggleExpand}
            className="flex w-full flex-col items-center justify-center space-y-1 rounded-lg py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Expand AI Assistant"
          >
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
              AI
            </span>
          </button>
        </>
      )}
    </div>
  );
}
