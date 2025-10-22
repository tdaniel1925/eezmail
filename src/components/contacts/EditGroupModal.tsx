'use client';

import { useState, useEffect } from 'react';
import { X, Users, Palette, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useContactGroup,
  updateContactGroup,
  deleteContactGroup,
  removeMembersFromContactGroup,
} from '@/hooks/useContactGroups';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#06B6D4',
  '#F97316',
];

interface EditGroupModalProps {
  groupId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onDeleted?: () => void;
}

export function EditGroupModal({
  groupId,
  open,
  onOpenChange,
  onSuccess,
  onDeleted,
}: EditGroupModalProps) {
  const { group, isLoading, mutate } = useContactGroup(groupId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update form when group data loads
  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
      setSelectedColor(group.color);
      setIsFavorite(group.isFavorite);
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupId || !name.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateContactGroup(groupId, {
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        isFavorite,
      });

      toast.success('Group updated successfully!');
      await mutate();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update group'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!groupId) return;

    setIsSubmitting(true);

    try {
      await deleteContactGroup(groupId);
      toast.success('Group deleted successfully!');
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete group'
      );
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRemoveMember = async (contactId: string) => {
    if (!groupId) return;

    try {
      await removeMembersFromContactGroup(groupId, { contactIds: [contactId] });
      toast.success('Member removed from group');
      await mutate();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Edit Group
          </DialogTitle>
          <DialogDescription>
            Update group details and manage members.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto flex-1 px-1"
        >
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-group-name">
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-group-name"
              placeholder="e.g., Sales Team, VIP Clients"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-group-description">
              Description (Optional)
            </Label>
            <Textarea
              id="edit-group-description"
              placeholder="Add a description for this group..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Group Color
            </Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-10 w-10 rounded-lg transition-all ${
                    selectedColor === color
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Favorite */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-group-favorite"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="edit-group-favorite" className="cursor-pointer">
              Mark as favorite (appears at top of list)
            </Label>
          </div>

          {/* Members List */}
          {group && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Members ({group.members?.length || 0})
                </Label>
              </div>

              {group.members && group.members.length > 0 ? (
                <div className="max-h-[200px] overflow-y-auto space-y-2 rounded-lg border p-2">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-md bg-gray-50 p-2 dark:bg-gray-800"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {member.displayName ||
                            `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
                            'Unknown'}
                        </p>
                        {member.email && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {member.email}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.contactId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No members in this group yet
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex items-center justify-between pt-4">
            {/* Delete Button (Left) */}
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Are you sure?</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  Yes, Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Save/Cancel Buttons (Right) */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

