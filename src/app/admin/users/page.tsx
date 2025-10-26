'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddUserModal } from '@/components/admin/AddUserModal';
import { BulkActionToolbar } from '@/components/admin/BulkActionToolbar';

export default function AdminUsersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setSelectedUserIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage all users and their subscriptions
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionToolbar
        selectedIds={selectedUserIds}
        onClearSelection={() => setSelectedUserIds([])}
        onActionComplete={handleRefresh}
      />

      {/* User Table - Will be loaded via server component */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-sm text-gray-500">Loading users...</p>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
