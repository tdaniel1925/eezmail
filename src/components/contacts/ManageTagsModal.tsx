'use client';

import { useState } from 'react';
import { X, Tag, Plus, Palette, Trash2, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useContactTags,
  createContactTag,
  updateContactTag,
  deleteContactTag,
} from '@/hooks/useContactTags';
import { TagBadge } from './TagBadge';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#F97316',
];

interface ManageTagsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ManageTagsModal({
  open,
  onOpenChange,
  onSuccess,
}: ManageTagsModalProps) {
  const { tags, isLoading, mutate } = useContactTags();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTagName.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createContactTag({
        name: newTagName.trim(),
        color: newTagColor,
      });

      toast.success('Tag created successfully!');
      setNewTagName('');
      setNewTagColor(PRESET_COLORS[0]);
      await mutate();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create tag'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (tagId: string, name: string, color: string) => {
    setEditingTagId(tagId);
    setEditName(name);
    setEditColor(color);
  };

  const handleSaveEdit = async (tagId: string) => {
    if (!editName.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateContactTag(tagId, {
        name: editName.trim(),
        color: editColor,
      });

      toast.success('Tag updated successfully!');
      setEditingTagId(null);
      await mutate();
      onSuccess?.();
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update tag'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditName('');
    setEditColor('');
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Are you sure you want to delete the tag "${tagName}"?`)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteContactTag(tagId);
      toast.success('Tag deleted successfully!');
      await mutate();
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Manage Tags
          </DialogTitle>
          <DialogDescription>
            Create, edit, and delete tags to organize your contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 px-1">
          {/* Create New Tag */}
          <form onSubmit={handleCreateTag} className="space-y-3 border-b pb-4">
            <Label className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Tag
            </Label>

            <div className="flex gap-2">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                maxLength={50}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !newTagName.trim()}
                size="sm"
              >
                Create
              </Button>
            </div>

            {/* Color Picker for New Tag */}
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`h-8 w-8 rounded-md transition-all ${
                    newTagColor === color
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </form>

          {/* Existing Tags List */}
          <div className="space-y-3">
            <Label className="flex items-center justify-between">
              <span>Your Tags ({tags.length})</span>
            </Label>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : tags.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No tags yet. Create your first tag above!
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    {editingTagId === tag.id ? (
                      // Edit Mode
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={50}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setEditColor(color)}
                              className={`h-6 w-6 rounded transition-all ${
                                editColor === color
                                  ? 'ring-2 ring-offset-1 ring-primary scale-110'
                                  : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(tag.id)}
                            disabled={isSubmitting || !editName.trim()}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex items-center gap-3 flex-1">
                          <TagBadge
                            name={tag.name}
                            color={tag.color}
                            size="md"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Used {tag.usageCount} time
                            {tag.usageCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleStartEdit(tag.id, tag.name, tag.color)
                            }
                            disabled={isSubmitting}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTag(tag.id, tag.name)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

