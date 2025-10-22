'use client';

import { useState } from 'react';
import { Users, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useContactGroups } from '@/hooks/useContactGroups';
import { cn } from '@/lib/utils';

interface GroupRecipientSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGroups: (groups: SelectedGroup[]) => void;
  selectedGroupIds?: string[];
}

export interface SelectedGroup {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  memberEmails: string[];
}

export function GroupRecipientSelector({
  open,
  onOpenChange,
  onSelectGroups,
  selectedGroupIds = [],
}: GroupRecipientSelectorProps) {
  const { groups, isLoading } = useContactGroups();
  const [localSelectedIds, setLocalSelectedIds] =
    useState<string[]>(selectedGroupIds);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleConfirm = async () => {
    // Fetch member emails for selected groups
    const selectedGroupsWithEmails: SelectedGroup[] = await Promise.all(
      localSelectedIds.map(async (groupId) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) return null;

        // Fetch group details with members
        try {
          const res = await fetch(`/api/contacts/groups/${groupId}`);
          const data = await res.json();

          if (data.success && data.group) {
            const memberEmails =
              data.group.members
                ?.map(
                  (m: { email?: string; primaryEmail?: string }) =>
                    m.email || m.primaryEmail
                )
                .filter(Boolean) || [];

            return {
              id: group.id,
              name: group.name,
              color: group.color,
              memberCount: group.memberCount,
              memberEmails,
            };
          }
        } catch (error) {
          console.error('Error fetching group members:', error);
        }

        return {
          id: group.id,
          name: group.name,
          color: group.color,
          memberCount: group.memberCount,
          memberEmails: [],
        };
      })
    ).then((results) => results.filter(Boolean) as SelectedGroup[]);

    onSelectGroups(selectedGroupsWithEmails);
    onOpenChange(false);
  };

  const toggleExpand = (groupId: string) => {
    setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Select Groups as Recipients
          </DialogTitle>
          <DialogDescription>
            Choose one or more groups. All members will receive the email.
          </DialogDescription>
        </DialogHeader>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
              No groups yet. Create a group in the Contacts page first.
            </p>
          ) : (
            groups.map((group) => {
              const isSelected = localSelectedIds.includes(group.id);
              const isExpanded = expandedGroupId === group.id;

              return (
                <div
                  key={group.id}
                  className={cn(
                    'rounded-lg border p-3 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                  )}
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="flex flex-1 items-center gap-3"
                    >
                      {/* Checkbox */}
                      <div
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-gray-300 dark:border-gray-600'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>

                      {/* Group Info */}
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {group.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({group.memberCount} member
                          {group.memberCount !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </button>

                    {/* Expand/Collapse Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(group.id)}
                      className="ml-2 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      {isExpanded ? 'Hide' : 'Preview'}
                    </button>
                  </div>

                  {/* Expanded Member Preview */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Members:
                      </p>
                      <div className="space-y-1 max-h-[120px] overflow-y-auto">
                        {group.members && group.members.length > 0 ? (
                          group.members.slice(0, 10).map((member, idx) => (
                            <p
                              key={idx}
                              className="text-sm text-gray-700 dark:text-gray-300 truncate"
                            >
                              {member.displayName ||
                                `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
                                'Unknown'}
                              {member.email && (
                                <span className="text-gray-500 dark:text-gray-400">
                                  {' '}
                                  ({member.email})
                                </span>
                              )}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No members
                          </p>
                        )}
                        {group.members && group.members.length > 10 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            ... and {group.members.length - 10} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {localSelectedIds.length} group
            {localSelectedIds.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={localSelectedIds.length === 0}
            >
              Add to Recipients
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

