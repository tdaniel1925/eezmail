'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, UserX, UserCheck, Crown, DollarSign, Loader2 } from 'lucide-react';

interface BulkActionToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export function BulkActionToolbar({ selectedIds, onClearSelection, onActionComplete }: BulkActionToolbarProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string>('');

  const handleBulkAction = async () => {
    if (!action || selectedIds.length === 0) return;

    const confirmMessage = `Are you sure you want to ${action} ${selectedIds.length} user(s)?`;
    if (!confirm(confirmMessage)) return;

    setLoading(true);

    try {
      let actionType = action;
      let value: string | undefined;

      // Parse action
      if (action.startsWith('tier:')) {
        actionType = 'changeTier';
        value = action.split(':')[1];
      } else if (action.startsWith('role:')) {
        actionType = 'changeRole';
        value = action.split(':')[1];
      }

      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          userIds: selectedIds,
          value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bulk operation failed');
      }

      alert(`Success: ${data.results.success} users updated, ${data.results.failed} failed`);
      onActionComplete();
      onClearSelection();
      setAction('');
    } catch (error: any) {
      alert(error.message || 'Failed to perform bulk action');
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
        {selectedIds.length} user(s) selected
      </span>

      <Select value={action} onValueChange={setAction} disabled={loading}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Choose action..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="suspend">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Suspend
            </div>
          </SelectItem>
          <SelectItem value="activate">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Activate
            </div>
          </SelectItem>
          <SelectItem value="tier:free">Change Tier → Free</SelectItem>
          <SelectItem value="tier:starter">Change Tier → Starter</SelectItem>
          <SelectItem value="tier:pro">Change Tier → Pro</SelectItem>
          <SelectItem value="tier:enterprise">Change Tier → Enterprise</SelectItem>
          <SelectItem value="role:user">Change Role → User</SelectItem>
          <SelectItem value="role:admin">Change Role → Admin</SelectItem>
          <SelectItem value="delete">
            <div className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4" />
              Delete
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={handleBulkAction} disabled={!action || loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Apply
      </Button>

      <Button variant="secondary" onClick={onClearSelection} disabled={loading}>
        Clear
      </Button>
    </div>
  );
}

