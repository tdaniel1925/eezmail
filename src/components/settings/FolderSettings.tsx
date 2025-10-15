'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createCustomFolder,
  deleteCustomFolder,
  reorderCustomFolders,
} from '@/lib/folders/actions';
import { toast } from '@/lib/toast';
import type { CustomFolder } from '@/db/schema';

interface FolderSettingsProps {
  userId: string;
  initialFolders: CustomFolder[];
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

export function FolderSettings({
  userId,
  initialFolders,
}: FolderSettingsProps): JSX.Element {
  const [folders, setFolders] = useState<CustomFolder[]>(initialFolders);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');
  const [newFolderColor, setNewFolderColor] = useState('gray');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setFolders(initialFolders);
  }, [initialFolders]);

  const handleCreate = async (): Promise<void> => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    const result = await createCustomFolder({
      userId,
      name: newFolderName.trim(),
      icon: newFolderIcon,
      color: newFolderColor,
    });

    if (result.success && result.folderId) {
      toast.success('Folder created successfully');
      setIsCreating(false);
      setNewFolderName('');
      setNewFolderIcon('📁');
      setNewFolderColor('gray');
      // Refresh page to get updated folders
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to create folder');
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

    const result = await deleteCustomFolder(folderId, userId);

    if (result.success) {
      toast.success('Folder deleted successfully');
      setFolders(folders.filter((f) => f.id !== folderId));
      // Refresh page to get updated folders
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to delete folder');
    }
  };

  const handleDragStart = (index: number): void => {
    setDraggedIndex(index);
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

    const folderIds = folders.map((f) => f.id);
    const result = await reorderCustomFolders(userId, folderIds);

    if (result.success) {
      toast.success('Folders reordered successfully');
    } else {
      toast.error(result.error || 'Failed to reorder folders');
      // Revert to original order
      setFolders(initialFolders);
    }

    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
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
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
    </div>
  );
}
