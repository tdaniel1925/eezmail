'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { deleteLabel } from '@/lib/labels/actions';
import { toast } from 'sonner';
import type { CustomLabel } from '@/db/schema';

interface DeleteLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  label: CustomLabel | null;
  onSuccess?: () => void;
}

export function DeleteLabelModal({
  isOpen,
  onClose,
  label,
  onSuccess,
}: DeleteLabelModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!label) return;

    setIsDeleting(true);

    try {
      const result = await deleteLabel(label.id);
      if (result.success) {
        toast.success('Label deleted successfully');
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || 'Failed to delete label');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!label) return null;

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
            onClick={onClose}
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
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertTriangle
                      size={20}
                      className="text-red-600 dark:text-red-400"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delete Label
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete the label{' '}
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ backgroundColor: label.color }}
                    />
                    "{label.name}"
                  </span>
                  ?
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This will remove the label from all emails. The emails
                  themselves will not be deleted.
                </p>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Label'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
