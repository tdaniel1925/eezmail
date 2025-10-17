'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PanelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: {
    insights: boolean;
    quickActions: boolean;
    chat: boolean;
    analytics: boolean;
    research: boolean;
  };
  autoExpandOnEmail: boolean;
  onToggleSection: (section: string) => void;
  onToggleAutoExpand: () => void;
  onResetDefaults: () => void;
}

export function PanelSettingsModal({
  isOpen,
  onClose,
  sections,
  autoExpandOnEmail,
  onToggleSection,
  onToggleAutoExpand,
  onResetDefaults,
}: PanelSettingsModalProps): JSX.Element {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop + Centered Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Panel Settings
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Panel Sections
                  </h3>
                  <div className="space-y-2">
                    <ToggleItem
                      label="Email Insights"
                      description="AI-powered analysis and summary"
                      checked={sections.insights}
                      onChange={() => onToggleSection('insights')}
                    />
                    <ToggleItem
                      label="Quick Actions"
                      description="Context-aware action buttons"
                      checked={sections.quickActions}
                      onChange={() => onToggleSection('quickActions')}
                    />
                    <ToggleItem
                      label="Analytics"
                      description="Sender stats and patterns"
                      checked={sections.analytics}
                      onChange={() => onToggleSection('analytics')}
                    />
                    <ToggleItem
                      label="Research"
                      description="Related emails and context"
                      checked={sections.research}
                      onChange={() => onToggleSection('research')}
                    />
                    <ToggleItem
                      label="Chat Interface"
                      description="Conversational AI assistant"
                      checked={sections.chat}
                      onChange={() => onToggleSection('chat')}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                  <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Behavior
                  </h3>
                  <ToggleItem
                    label="Auto-expand on email view"
                    description="Automatically open panel when viewing emails"
                    checked={autoExpandOnEmail}
                    onChange={onToggleAutoExpand}
                  />
                </div>

                {/* Reset Button */}
                <button
                  onClick={onResetDefaults}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Reset to Defaults
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ToggleItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleItem({
  label,
  description,
  checked,
  onChange,
}: ToggleItemProps): JSX.Element {
  return (
    <label className="flex cursor-pointer items-start space-x-3 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-700"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </div>
      </div>
    </label>
  );
}
