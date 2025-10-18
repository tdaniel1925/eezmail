'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLabels } from '@/lib/labels/actions';
import { toast } from 'sonner';
import type { CustomLabel } from '@/db/schema';

interface LabelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLabels: (labelIds: string[]) => void;
}

export function LabelSelectorModal({
  isOpen,
  onClose,
  onSelectLabels,
}: LabelSelectorModalProps) {
  const [labels, setLabels] = useState<CustomLabel[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadLabels();
    }
  }, [isOpen]);

  const loadLabels = async () => {
    setIsLoading(true);
    try {
      const result = await getLabels();
      if (result.success && result.labels) {
        setLabels(result.labels);
      } else {
        toast.error(result.error || 'Failed to load labels');
      }
    } catch (error) {
      console.error('Error loading labels:', error);
      toast.error('Failed to load labels');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    const newSelection = new Set(selectedLabelIds);
    if (newSelection.has(labelId)) {
      newSelection.delete(labelId);
    } else {
      newSelection.add(labelId);
    }
    setSelectedLabelIds(newSelection);
  };

  const handleConfirm = () => {
    const selectedIds = Array.from(selectedLabelIds);
    if (selectedIds.length === 0) {
      toast.error('Please select at least one label');
      return;
    }
    onSelectLabels(selectedIds);
    setSelectedLabelIds(new Set());
    onClose();
  };

  const handleCancel = () => {
    setSelectedLabelIds(new Set());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Tag size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Apply Labels
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Select labels to apply to selected emails
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Label List */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : labels.length === 0 ? (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      No labels yet
                    </p>
                    <button
                      onClick={() => {
                        // Navigate to create label
                        window.location.href = '/dashboard/settings?tab=labels';
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      <Plus size={16} />
                      Create Label
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {labels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all',
                          selectedLabelIds.has(label.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        )}
                      >
                        <div
                          className="w-4 h-4 rounded-sm"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {label.name}
                        </span>
                        {selectedLabelIds.has(label.id) && (
                          <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              {labels.length > 0 && (
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={selectedLabelIds.size === 0}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Apply{' '}
                    {selectedLabelIds.size > 0 && `(${selectedLabelIds.size})`}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
