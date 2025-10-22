'use client';

import { useState } from 'react';
import { Users, Tag, Trash2, X, FolderPlus, FolderMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContactGroups } from '@/hooks/useContactGroups';
import { useContactTags } from '@/hooks/useContactTags';
import { toast } from 'sonner';

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedIds: string[];
  onClearSelection: () => void;
  onRefresh?: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  selectedIds,
  onClearSelection,
  onRefresh,
}: BulkActionsToolbarProps) {
  const { groups } = useContactGroups();
  const { tags } = useContactTags();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBulkAction = async (
    action: string,
    groupId?: string,
    tagIds?: string[]
  ) => {
    if (selectedIds.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          contactIds: selectedIds,
          groupId,
          tagIds,
        }),
      });

      if (!res.ok) {
        throw new Error('Bulk action failed');
      }

      const result = await res.json();

      toast.success(
        `Successfully processed ${result.affectedCount} contact${result.affectedCount !== 1 ? 's' : ''}`
      );

      onClearSelection();
      onRefresh?.();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToGroup = (groupId: string) => {
    handleBulkAction('add-to-group', groupId);
  };

  const handleRemoveFromGroup = (groupId: string) => {
    handleBulkAction('remove-from-group', groupId);
  };

  const handleAddTags = (tagIds: string[]) => {
    if (tagIds.length === 0) return;
    handleBulkAction('add-tags', undefined, tagIds);
  };

  const handleRemoveTags = (tagIds: string[]) => {
    if (tagIds.length === 0) return;
    handleBulkAction('remove-tags', undefined, tagIds);
  };

  const handleDelete = () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedCount} contact${selectedCount !== 1 ? 's' : ''}?`
      )
    ) {
      return;
    }
    handleBulkAction('delete');
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-xl dark:border-gray-700 dark:bg-gray-800">
      {/* Selection Count */}
      <div className="flex items-center gap-2 border-r border-gray-200 pr-4 dark:border-gray-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
          <span className="text-sm font-semibold">{selectedCount}</span>
        </div>
        <span className="text-sm font-medium">
          {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Add to Group */}
        <Select
          onValueChange={handleAddToGroup}
          disabled={isSubmitting || groups.length === 0}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <FolderPlus className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Add to Group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Remove from Group */}
        <Select
          onValueChange={handleRemoveFromGroup}
          disabled={isSubmitting || groups.length === 0}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <FolderMinus className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Remove from Group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add Tags */}
        <Select
          onValueChange={(tagId) => handleAddTags([tagId])}
          disabled={isSubmitting || tags.length === 0}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <Tag className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Add Tag" />
          </SelectTrigger>
          <SelectContent>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <div
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Delete */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={isSubmitting}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Clear Selection */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        disabled={isSubmitting}
        className="ml-2"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

