'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { AddUserModal } from '@/components/admin/AddUserModal';
import type { User } from '@/lib/admin/users';

export default function AdminUsersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [refreshKey]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              User Management
            </h1>
            <p className="text-gray-400 mt-2">
              Manage all users and their subscriptions
            </p>
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* User Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400" />
              <p className="text-sm text-gray-400 mt-2">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {user.name || user.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isSandboxUser
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {user.isSandboxUser ? 'Sandbox' : 'Regular'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.roleHierarchy?.includes('admin')
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {user.roleHierarchy?.replace(/_/g, ' ') || user.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.tier === 'enterprise'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : user.tier === 'team'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : user.tier === 'individual'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {user.tier || 'individual'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            onClick={() => {/* TODO: View user details */}}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        <AddUserModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onSuccess={handleRefresh}
        />
      </div>
    </div>
  );
}
