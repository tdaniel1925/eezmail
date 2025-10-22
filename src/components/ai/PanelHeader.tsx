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
  // Collapsed state - full-height animated vertical bar
  if (!isExpanded) {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <motion.button
          onClick={onToggleExpand}
          className="relative flex w-full h-full flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all"
          whileHover={{ scale: 1.02 }}
          title="Expand AI Assistant"
        >
          {/* Animated gradient shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent"
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          {/* Sparkles icon at top with pulse */}
          <motion.div
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative z-10 mb-4"
          >
            <Sparkles className="h-6 w-6 text-white" />
          </motion.div>

          {/* Vertical text */}
          <span
            className="text-white font-bold text-sm tracking-wider relative z-10"
            style={{ 
              writingMode: 'vertical-rl', 
              textOrientation: 'mixed' 
            }}
          >
            AI ASSISTANT
          </span>
        </motion.button>
      </div>
    );
  }

  // Expanded state - normal header
  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
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
    </div>
  );
}
