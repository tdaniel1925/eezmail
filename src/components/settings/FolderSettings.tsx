'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineNotification } from '@/components/ui/inline-notification';
import type { CustomFolder } from '@/db/schema';

interface FolderSettingsProps {
  userId: string;
}

const PRESET_COLORS = [
  { name: 'Gray', value: 'gray', class: 'bg-gray-500' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
];

const PRESET_EMOJIS = [
  '📁',
  '📂',
  '💼',
  '🏠',
  '👨‍👩‍👧‍👦',
  '💰',
  '🎯',
  '⭐',
  '🔥',
  '📊',
  '🚀',
  '💡',
  '🎨',
  '🎓',
  '⚙️',
  '🛠️',
];

export function FolderSettings({ userId }: FolderSettingsProps): JSX.Element {
  const [folders, setFolders] = useState<CustomFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');
  const [newFolderColor, setNewFolderColor] = useState('gray');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [initialFolders, setInitialFolders] = useState<CustomFolder[]>([]);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Load custom folders on mount
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setIsLoading(true);
    setNotification(null);
    try {
      const response = await fetch('/api/folders/custom');
      
      if (!response.ok) {
        if (response.status === 401) {
          setNotification({
            type: 'error',
            message: 'Session expired. Please log in again.',
          });
          return;
        }
        throw new Error('Failed to load folders');
      }

      const result = await response.json();
      
      if (result.success) {
        setFolders(result.folders || []);
        setInitialFolders(result.folders || []);
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to load custom folders',
        });
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load custom folders',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (): Promise<void> => {
    if (!newFolderName.trim()) {
      setNotification({
        type: 'error',
        message: 'Please enter a folder name',
      });
      return;
    }

    setNotification(null);
    try {
      const response = await fetch('/api/folders/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          icon: newFolderIcon,
          color: newFolderColor,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Folder created successfully',
        });
        setIsCreating(false);
        setNewFolderName('');
        setNewFolderIcon('📁');
        setNewFolderColor('gray');
        await loadFolders();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to create folder',
        });
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create folder',
      });
    }
  };

  const handleDelete = async (folderId: string): Promise<void> => {
    if (
      !confirm(
        'Are you sure you want to delete this folder? Emails in this folder will be moved to Inbox.'
      )
    ) {
      return;
    }

    setNotification(null);
    try {
      const response = await fetch(`/api/folders/custom/${folderId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Folder deleted successfully',
        });
        await loadFolders();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to delete folder',
        });
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete folder',
      });
    }
  };

  const handleDragStart = (index: number): void => {
    setDraggedIndex(index);
    setInitialFolders([...folders]); // Store initial state for potential revert
  };

  const handleDragOver = (e: React.DragEvent, index: number): void => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFolders = [...folders];
    const draggedFolder = newFolders[draggedIndex];
    newFolders.splice(draggedIndex, 1);
    newFolders.splice(index, 0, draggedFolder);

    setFolders(newFolders);
    setDraggedIndex(index);
  };

  const handleDragEnd = async (): Promise<void> => {
    if (draggedIndex === null) return;

    setNotification(null);
    const folderIds = folders.map((f) => f.id);

    try {
      const response = await fetch('/api/folders/custom', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderIds }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Folders reordered successfully',
        });
        setInitialFolders([...folders]); // Update initial state
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to reorder folders',
        });
        // Revert to original order
        setFolders(initialFolders);
      }
    } catch (error) {
      console.error('Error reordering folders:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to reorder folders',
      });
      // Revert to original order
      setFolders(initialFolders);
    }

    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Inline Notification */}
      {notification && (
        <InlineNotification
          type={notification.type}
          message={notification.message}
          onDismiss={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Custom Folders
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Create personalized folders to organize your emails. Maximum 20
          folders.
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Create New Folder */}
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          disabled={folders.length >= 20}
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Add Custom Folder {folders.length > 0 && `(${folders.length}/20)`}
        </button>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Work Projects"
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-2xl hover:border-primary transition-colors"
                  >
                    {newFolderIcon}
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute z-10 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg grid grid-cols-4 gap-2">
                      {PRESET_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setNewFolderIcon(emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewFolderColor(color.value)}
                      className={cn(
                        'h-10 rounded-lg border-2 transition-all',
                        color.class,
                        newFolderColor === color.value
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Check size={16} />
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewFolderName('');
                  setNewFolderIcon('📁');
                  setNewFolderColor('gray');
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder List */}
      {folders.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Your Folders
          </h3>
          {folders.map((folder, index) => (
            <div
              key={folder.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all cursor-move',
                draggedIndex === index && 'opacity-50'
              )}
            >
              <GripVertical
                size={20}
                className="text-gray-400 flex-shrink-0 cursor-grab active:cursor-grabbing"
              />
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{folder.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {folder.name}
                  </p>
                </div>
                <div
                  className={cn(
                    'w-6 h-6 rounded-full',
                    folder.color === 'gray' && 'bg-gray-500',
                    folder.color === 'blue' && 'bg-blue-500',
                    folder.color === 'green' && 'bg-green-500',
                    folder.color === 'yellow' && 'bg-yellow-500',
                    folder.color === 'red' && 'bg-red-500',
                    folder.color === 'purple' && 'bg-purple-500',
                    folder.color === 'pink' && 'bg-pink-500',
                    folder.color === 'orange' && 'bg-orange-500'
                  )}
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleDelete(folder.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Delete folder"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            No custom folders yet. Create one to get started!
          </p>
        </div>
      )}
        </>
      )}
    </div>
  );
}
