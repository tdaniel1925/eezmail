/**
 * Bulk Actions Component
 * Multi-select and batch operations for contacts
 */

'use client';

import { useState } from 'react';
import { Trash2, Tag, Download, Star, X } from 'lucide-react';
import { toast, confirmDialog } from '@/lib/toast';
import { deleteContact, toggleFavorite } from '@/lib/contacts/actions';
import { assignTags } from '@/lib/contacts/tag-actions';
import { exportToCSV } from '@/lib/contacts/import-export';
import type { ContactTag } from '@/db/schema';

interface BulkActionsProps {
  selectedIds: string[];
  userId: string;
  availableTags: ContactTag[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export function BulkActions({
  selectedIds,
  userId,
  availableTags,
  onClearSelection,
  onRefresh,
}: BulkActionsProps): JSX.Element | null {
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleDelete = async () => {
    const confirmed = await confirmDialog(
      `Are you sure you want to delete ${selectedIds.length} contact(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const contactId of selectedIds) {
      try {
        const result = await deleteContact(contactId, userId);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsProcessing(false);

    if (successCount > 0) {
      toast.success(`Deleted ${successCount} contact(s)`);
      onRefresh();
      onClearSelection();
    }

    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} contact(s)`);
    }
  };

  const handleAddTag = async (tagId: string) => {
    setIsProcessing(true);
    let successCount = 0;

    for (const contactId of selectedIds) {
      try {
        const result = await assignTags(contactId, userId, [tagId]);
        if (result.success) successCount++;
      } catch (error) {
        console.error('Error assigning tag:', error);
      }
    }

    setIsProcessing(false);
    setShowTagMenu(false);

    if (successCount > 0) {
      toast.success(`Tagged ${successCount} contact(s)`);
      onRefresh();
    }
  };

  const handleToggleFavorite = async () => {
    setIsProcessing(true);
    let successCount = 0;

    for (const contactId of selectedIds) {
      try {
        const result = await toggleFavorite(contactId, userId);
        if (result.success) successCount++;
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }

    setIsProcessing(false);

    if (successCount > 0) {
      toast.success(`Updated ${successCount} contact(s)`);
      onRefresh();
      onClearSelection();
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);

    try {
      const csv = await exportToCSV(userId, selectedIds);

      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${selectedIds.length} contact(s)`);
      onClearSelection();
    } catch (error) {
      toast.error('Failed to export contacts');
      console.error('Export error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-900 border-2 border-primary shadow-2xl rounded-full px-6 py-3 flex items-center gap-4">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
            {selectedIds.length}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            selected
          </span>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-700"></div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Favorite */}
          <button
            onClick={handleToggleFavorite}
            disabled={isProcessing}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Toggle Favorite"
          >
            <Star size={20} className="text-gray-700 dark:text-gray-300" />
          </button>

          {/* Tag */}
          <div className="relative">
            <button
              onClick={() => setShowTagMenu(!showTagMenu)}
              disabled={isProcessing}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Add Tag"
            >
              <Tag size={20} className="text-gray-700 dark:text-gray-300" />
            </button>

            {showTagMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 min-w-[200px]">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
                  Add Tag
                </div>
                {availableTags.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 px-2 py-1">
                    No tags available
                  </p>
                ) : (
                  availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleAddTag(tag.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color || '#3B82F6' }}
                      ></span>
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={isProcessing}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Export Selected"
          >
            <Download size={20} className="text-gray-700 dark:text-gray-300" />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={isProcessing}
            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            title="Delete Selected"
          >
            <Trash2 size={20} className="text-red-600 dark:text-red-400" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-700"></div>

        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          disabled={isProcessing}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          title="Clear Selection"
        >
          <X size={20} className="text-gray-700 dark:text-gray-300" />
        </button>

        {/* Loading Indicator */}
        {isProcessing && (
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
        )}
      </div>
    </div>
  );
}
