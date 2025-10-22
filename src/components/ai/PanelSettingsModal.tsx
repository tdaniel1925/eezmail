'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabType } from '@/stores/aiPanelStore';

interface PanelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoExpandOnEmail: boolean;
  defaultTab: TabType;
  onToggleAutoExpand: () => void;
  onSetDefaultTab: (tab: TabType) => void;
}

export function PanelSettingsModal({
  isOpen,
  onClose,
  autoExpandOnEmail,
  defaultTab,
  onToggleAutoExpand,
  onSetDefaultTab,
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
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Assistant Settings
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Settings */}
              <div className="space-y-6">
                {/* Auto-expand toggle */}
                <div>
                  <label className="flex cursor-pointer items-start space-x-3 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="checkbox"
                      checked={autoExpandOnEmail}
                      onChange={onToggleAutoExpand}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Auto-open when viewing emails
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Automatically expand the panel when you select an email
                      </div>
                    </div>
                  </label>
                </div>

                {/* Default tab selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default tab when opening
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onSetDefaultTab('chat')}
                      className={`
                        px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all
                        ${
                          defaultTab === 'chat'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary'
                        }
                      `}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => onSetDefaultTab('insights')}
                      className={`
                        px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all
                        ${
                          defaultTab === 'insights'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary'
                        }
                      `}
                    >
                      Insights
                    </button>
                    <button
                      onClick={() => onSetDefaultTab('actions')}
                      className={`
                        px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all
                        ${
                          defaultTab === 'actions'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary'
                        }
                      `}
                    >
                      Actions
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Choose which tab appears first when selecting an email
                  </p>
                </div>

                {/* Info text */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Panel width can be adjusted by dragging the left edge when expanded.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
