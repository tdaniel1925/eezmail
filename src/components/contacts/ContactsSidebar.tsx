'use client';

import { useState } from 'react';
import { Users, Star, Tag, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupBadge } from './GroupBadge';
import { TagBadge } from './TagBadge';
import { useContactGroups } from '@/hooks/useContactGroups';
import { useContactTags } from '@/hooks/useContactTags';
import { cn } from '@/lib/utils';

interface ContactsSidebarProps {
  onFilterChange: (filter: ContactFilter) => void;
  currentFilter: ContactFilter;
  onCreateGroup: () => void;
  onManageTags: () => void;
  className?: string;
}

export interface ContactFilter {
  type: 'all' | 'favorites' | 'group' | 'tag';
  groupId?: string;
  tagIds?: string[];
}

export function ContactsSidebar({
  onFilterChange,
  currentFilter,
  onCreateGroup,
  onManageTags,
  className,
}: ContactsSidebarProps) {
  const { groups, isLoading: isLoadingGroups } = useContactGroups();
  const { tags, isLoading: isLoadingTags } = useContactTags();
  const [expandedSections, setExpandedSections] = useState({
    groups: true,
    tags: true,
  });

  const toggleSection = (section: 'groups' | 'tags') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFilterClick = (filter: ContactFilter) => {
    onFilterChange(filter);
  };

  const isActiveFilter = (type: string, id?: string) => {
    if (type === 'all') return currentFilter.type === 'all';
    if (type === 'favorites') return currentFilter.type === 'favorites';
    if (type === 'group')
      return currentFilter.type === 'group' && currentFilter.groupId === id;
    if (type === 'tag')
      return (
        currentFilter.type === 'tag' && currentFilter.tagIds?.includes(id || '')
      );
    return false;
  };

  // Sort groups: favorites first, then alphabetically
  const sortedGroups = [...groups].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.name.localeCompare(b.name);
  });

  // Sort tags alphabetically
  const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900',
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Contacts
        </h2>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* All Contacts */}
        <button
          onClick={() => handleFilterClick({ type: 'all' })}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            isActiveFilter('all')
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          )}
        >
          <Users className="h-4 w-4" />
          <span>All Contacts</span>
        </button>

        {/* Favorites */}
        <button
          onClick={() => handleFilterClick({ type: 'favorites' })}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            isActiveFilter('favorites')
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          )}
        >
          <Star className="h-4 w-4" />
          <span>Favorites</span>
        </button>

        {/* Groups Section */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 py-2">
            <button
              onClick={() => toggleSection('groups')}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              <span>Groups ({groups.length})</span>
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCreateGroup}
              className="h-6 w-6 p-0"
              title="Create new group"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {expandedSections.groups && (
            <div className="space-y-1">
              {isLoadingGroups ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Loading...
                </div>
              ) : groups.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No groups yet
                </div>
              ) : (
                sortedGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() =>
                      handleFilterClick({ type: 'group', groupId: group.id })
                    }
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                      isActiveFilter('group', group.id)
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {group.isFavorite && (
                        <Star className="h-3 w-3 flex-shrink-0 text-yellow-500" />
                      )}
                      <div
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="truncate">{group.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {group.memberCount}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 py-2">
            <button
              onClick={() => toggleSection('tags')}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              <span>Tags ({tags.length})</span>
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onManageTags}
              className="h-6 w-6 p-0"
              title="Manage tags"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>

          {expandedSections.tags && (
            <div className="space-y-1">
              {isLoadingTags ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Loading...
                </div>
              ) : tags.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No tags yet
                </div>
              ) : (
                sortedTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() =>
                      handleFilterClick({ type: 'tag', tagIds: [tag.id] })
                    }
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                      isActiveFilter('tag', tag.id)
                        ? 'bg-primary/10 font-medium'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <TagBadge name={tag.name} color={tag.color} size="sm" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tag.usageCount}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

