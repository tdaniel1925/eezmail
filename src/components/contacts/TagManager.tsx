/**
 * Tag Manager Component
 * Create, edit, and manage contact tags
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import {
  createTag,
  updateTag,
  deleteTag,
  listTags,
} from '@/lib/contacts/tag-actions';
import type { ContactTag } from '@/db/schema';

interface TagManagerProps {
  userId: string;
}

const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Gray', value: '#6B7280' },
];

export function TagManager({ userId }: TagManagerProps): JSX.Element {
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(COLOR_OPTIONS[0].value);

  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');

  useEffect(() => {
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const tagsList = await listTags(userId);
      setTags(tagsList);
    } catch {
      toast.error('Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    setIsCreating(true);
    const result = await createTag(userId, {
      name: newTagName.trim(),
      color: newTagColor,
    });

    if (result.success) {
      toast.success('Tag created successfully');
      setNewTagName('');
      setNewTagColor(COLOR_OPTIONS[0].value);
      loadTags();
    } else {
      toast.error(result.error || 'Failed to create tag');
    }

    setIsCreating(false);
  };

  const handleStartEdit = (tag: ContactTag) => {
    setEditingId(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color || COLOR_OPTIONS[0].value);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTagName.trim()) return;

    const result = await updateTag(editingId, userId, {
      name: editTagName.trim(),
      color: editTagColor,
    });

    if (result.success) {
      toast.success('Tag updated successfully');
      setEditingId(null);
      loadTags();
    } else {
      toast.error(result.error || 'Failed to update tag');
    }
  };

  const handleDelete = async (tagId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this tag? It will be removed from all contacts.'
      )
    ) {
      return;
    }

    const result = await deleteTag(tagId, userId);

    if (result.success) {
      toast.success('Tag deleted successfully');
      loadTags();
    } else {
      toast.error(result.error || 'Failed to delete tag');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Manage Contact Tags
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create and organize tags to categorize your contacts
        </p>
      </div>

      {/* Create New Tag */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Create New Tag
        </h4>
        <div className="flex gap-3">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Tag name"
            maxLength={50}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          />

          <select
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
          >
            {COLOR_OPTIONS.map((color) => (
              <option key={color.value} value={color.value}>
                {color.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreate}
            disabled={isCreating || !newTagName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Create
          </button>
        </div>
      </div>

      {/* Tags List */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Your Tags ({tags.length})
        </h4>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : tags.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            No tags yet. Create your first tag above.
          </p>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                {editingId === tag.id ? (
                  <>
                    {/* Edit Mode */}
                    <input
                      type="text"
                      value={editTagName}
                      onChange={(e) => setEditTagName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                    />
                    <select
                      value={editTagColor}
                      onChange={(e) => setEditTagColor(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                    >
                      {COLOR_OPTIONS.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {/* View Mode */}
                    <div
                      className="h-4 w-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color || '#3B82F6' }}
                    ></div>
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                      {tag.name}
                    </span>
                    <button
                      onClick={() => handleStartEdit(tag)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      title="Edit tag"
                    >
                      <Edit2
                        size={16}
                        className="text-gray-600 dark:text-gray-400"
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete tag"
                    >
                      <Trash2
                        size={16}
                        className="text-red-600 dark:text-red-400"
                      />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
