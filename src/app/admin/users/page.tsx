'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Loader2,
  MoreVertical,
  Ban,
  CheckCircle,
  Trash2,
  Mail,
  Key,
  AlertTriangle,
} from 'lucide-react';
import { AddUserModal } from '@/components/admin/AddUserModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: string;
  tier: string;
  isSandboxUser: boolean;
  isSuspended?: boolean;
  isDeleted?: boolean;
  createdAt: Date;
}

export default function AdminUsersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
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
        showNotification('error', 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [refreshKey]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUserAction = async (
    userId: string,
    action: string,
    username?: string
  ) => {
    const confirmMessages: { [key: string]: string } = {
      suspend: `Are you sure you want to suspend user ${username}? They will not be able to login.`,
      activate: `Are you sure you want to activate user ${username}?`,
      delete: `Are you sure you want to delete user ${username}? This can be undone.`,
      hard_delete: `⚠️ PERMANENT DELETE: Are you sure you want to permanently delete user ${username}? This CANNOT be undone!`,
      reset_password: `Send password reset email to ${username}?`,
      verify_email: `Mark ${username}'s email as verified?`,
    };

    if (action !== 'reset_password' && action !== 'verify_email') {
      if (!confirm(confirmMessages[action])) return;
    }

    try {
      setActionLoading(userId);

      if (action === 'delete' || action === 'hard_delete') {
        const response = await fetch(
          `/api/admin/users/${userId}?hard=${action === 'hard_delete'}`,
          { method: 'DELETE' }
        );
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);
        showNotification('success', data.message);
      } else {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);
        showNotification('success', data.message);
      }

      handleRefresh();
    } catch (error) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Action failed'
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-900/90 border-green-700 text-green-100'
                : 'bg-red-900/90 border-red-700 text-red-100'
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 mt-2">
              Complete control over all user accounts
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
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Role
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
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-sm text-gray-400"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm font-mono text-blue-400">
                            {user.username || '—'}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isDeleted ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-900/30 text-gray-400">
                              Deleted
                            </span>
                          ) : user.isSuspended ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-red-900/30 text-red-400">
                              Suspended
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-900/30 text-green-400">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              user.isSandboxUser
                                ? 'bg-purple-900/30 text-purple-400'
                                : 'bg-blue-900/30 text-blue-400'
                            }`}
                          >
                            {user.isSandboxUser ? 'Sandbox' : 'Regular'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              user.role === 'super_admin'
                                ? 'bg-red-900/30 text-red-400'
                                : user.role === 'admin'
                                  ? 'bg-orange-900/30 text-orange-400'
                                  : 'bg-gray-900/30 text-gray-400'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatDistanceToNow(new Date(user.createdAt), {
                            addSuffix: true,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {actionLoading === user.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-blue-400 ml-auto" />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-56 bg-slate-800 border-slate-700"
                              >
                                {/* Status Actions */}
                                {!user.isDeleted && (
                                  <>
                                    {user.isSuspended ? (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleUserAction(
                                            user.id,
                                            'activate',
                                            user.username
                                          )
                                        }
                                        className="text-green-400 focus:text-green-300 focus:bg-green-900/20"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Activate User
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleUserAction(
                                            user.id,
                                            'suspend',
                                            user.username
                                          )
                                        }
                                        className="text-yellow-400 focus:text-yellow-300 focus:bg-yellow-900/20"
                                      >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Suspend User
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator className="bg-slate-700" />
                                  </>
                                )}

                                {/* Account Actions */}
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction(
                                      user.id,
                                      'send_password_change',
                                      user.username
                                    )
                                  }
                                  className="text-blue-400 focus:text-blue-300 focus:bg-blue-900/20"
                                >
                                  <Key className="mr-2 h-4 w-4" />
                                  Send Password Change Link
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction(
                                      user.id,
                                      'send_username_change',
                                      user.username
                                    )
                                  }
                                  className="text-blue-400 focus:text-blue-300 focus:bg-blue-900/20"
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Username Change Link
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction(
                                      user.id,
                                      'reset_password',
                                      user.username
                                    )
                                  }
                                  className="text-blue-400 focus:text-blue-300 focus:bg-blue-900/20"
                                >
                                  <Key className="mr-2 h-4 w-4" />
                                  Force Password Reset
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction(
                                      user.id,
                                      'verify_email',
                                      user.username
                                    )
                                  }
                                  className="text-blue-400 focus:text-blue-300 focus:bg-blue-900/20"
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Verify Email
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="bg-slate-700" />

                                {/* Delete Actions */}
                                {!user.isDeleted && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUserAction(
                                        user.id,
                                        'delete',
                                        user.username
                                      )
                                    }
                                    className="text-orange-400 focus:text-orange-300 focus:bg-orange-900/20"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                  </DropdownMenuItem>
                                )}
                                {user.role !== 'super_admin' && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUserAction(
                                        user.id,
                                        'hard_delete',
                                        user.username
                                      )
                                    }
                                    className="text-red-400 focus:text-red-300 focus:bg-red-900/20"
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Permanent Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            Action Descriptions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-400">
            <div>
              <strong className="text-yellow-400">Suspend:</strong> Temporarily
              disable login (reversible)
            </div>
            <div>
              <strong className="text-green-400">Activate:</strong> Re-enable
              suspended account
            </div>
            <div>
              <strong className="text-blue-400">Reset Password:</strong> Send
              password reset email
            </div>
            <div>
              <strong className="text-blue-400">Verify Email:</strong> Mark
              email as verified
            </div>
            <div>
              <strong className="text-orange-400">Delete:</strong> Soft delete
              (can be restored)
            </div>
            <div>
              <strong className="text-red-400">Permanent Delete:</strong>{' '}
              Irreversible deletion
            </div>
          </div>
        </div>
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
