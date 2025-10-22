'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useContactTags,
  createContactTag,
  assignTagsToContact,
  removeTagsFromContact,
} from '@/hooks/useContactTags';
import { TagBadge } from './TagBadge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  contactId: string;
  selectedTagIds: string[];
  onTagsChange?: (tagIds: string[]) => void;
  className?: string;
}

export function TagSelector({
  contactId,
  selectedTagIds,
  onTagsChange,
  className,
}: TagSelectorProps) {
  const { tags, mutate } = useContactTags();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const availableTags = tags.filter(
    (tag) =>
      !selectedTagIds.includes(tag.id) &&
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleTag = async (tagId: string, isSelected: boolean) => {
    try {
      if (isSelected) {
        // Remove tag
        await removeTagsFromContact(contactId, { tagIds: [tagId] });
        const newTagIds = selectedTagIds.filter((id) => id !== tagId);
        onTagsChange?.(newTagIds);
      } else {
        // Add tag
        await assignTagsToContact(contactId, { tagIds: [tagId] });
        const newTagIds = [...selectedTagIds, tagId];
        onTagsChange?.(newTagIds);
      }
    } catch (error) {
      console.error('Error toggling tag:', error);
      toast.error('Failed to update tag');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      return;
    }

    setIsCreating(true);

    try {
      const newTag = await createContactTag({
        name: newTagName.trim(),
        color: '#10B981',
      });

      await mutate();

      // Automatically assign the new tag
      await assignTagsToContact(contactId, { tagIds: [newTag.id] });
      const newTagIds = [...selectedTagIds, newTag.id];
      onTagsChange?.(newTagIds);

      toast.success('Tag created and assigned!');
      setNewTagName('');
      setSearchQuery('');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeTagsFromContact(contactId, { tagIds: [tagId] });
      const newTagIds = selectedTagIds.filter((id) => id !== tagId);
      onTagsChange?.(newTagIds);
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            name={tag.name}
            color={tag.color}
            removable
            onRemove={() => handleRemoveTag(tag.id)}
          />
        ))}
      </div>

      {/* Dropdown Trigger */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {selectedTags.length > 0
            ? `${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''} selected`
            : 'Select tags...'}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <Input
              placeholder="Search or create tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          {/* Tag List */}
          <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
            {/* Create New Tag Option */}
            {searchQuery && !isCreating && (
              <button
                type="button"
                onClick={handleCreateTag}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="h-4 w-4 text-green-600" />
                <span>Create &quot;{searchQuery}&quot;</span>
              </button>
            )}

            {/* Available Tags */}
            {availableTags.length > 0 ? (
              availableTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id, isSelected)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <TagBadge name={tag.name} color={tag.color} />
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })
            ) : searchQuery ? (
              <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No tags found. Create a new one?
              </p>
            ) : (
              <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                All tags are already assigned
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

