'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Folder, Inbox, Send, Archive, Trash2, Spam } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folderId: string) => void;
}

const FOLDERS = [
  { id: 'inbox', name: 'Inbox', icon: Inbox, color: 'text-blue-500' },
  { id: 'sent', name: 'Sent', icon: Send, color: 'text-green-500' },
  { id: 'archived', name: 'Archived', icon: Archive, color: 'text-gray-500' },
  { id: 'spam', name: 'Spam', icon: Spam, color: 'text-red-500' },
  { id: 'trash', name: 'Trash', icon: Trash2, color: 'text-red-600' },
];

export function FolderSelectorModal({
  isOpen,
  onClose,
  onSelectFolder,
}: FolderSelectorModalProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const handleSelect = (folderId: string) => {
    setSelectedFolder(folderId);
  };

  const handleConfirm = () => {
    if (selectedFolder) {
      onSelectFolder(selectedFolder);
      onClose();
    }
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
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Folder size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Move to Folder
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Select a destination folder
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

              {/* Folder List */}
              <div className="p-4 space-y-2">
                {FOLDERS.map((folder) => {
                  const Icon = folder.icon;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => handleSelect(folder.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all',
                        selectedFolder === folder.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', folder.color)} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {folder.name}
                      </span>
                      {selectedFolder === folder.id && (
                        <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!selectedFolder}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Move
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
