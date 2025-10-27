'use client';

import { useState, useEffect, Fragment } from 'react';
import { Check, X, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
}

const ROLES = [
  { value: 'user', label: 'User' },
  { value: 'team_user', label: 'Team User' },
  { value: 'team_admin', label: 'Team Admin' },
  { value: 'team_super_admin', label: 'Team Super Admin' },
  { value: 'enterprise_user', label: 'Enterprise User' },
  { value: 'enterprise_admin', label: 'Enterprise Admin' },
  { value: 'enterprise_super_admin', label: 'Enterprise Super Admin' },
  { value: 'system_admin', label: 'System Admin' },
  { value: 'system_super_admin', label: 'System Super Admin' },
];

export function PermissionsMatrix() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<
    Record<string, Set<string>>
  >({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setNotification(null);

      // Load all permissions
      const permsRes = await fetch('/api/admin/permissions');
      if (!permsRes.ok) throw new Error('Failed to load permissions');
      const permsData = await permsRes.json();
      setPermissions(permsData.permissions);

      // Load permissions for each role
      const rolePermsMap: Record<string, Set<string>> = {};
      await Promise.all(
        ROLES.map(async (role) => {
          const res = await fetch(`/api/admin/permissions/roles/${role.value}`);
          if (res.ok) {
            const data = await res.json();
            rolePermsMap[role.value] = new Set(
              data.permissions.map((p: Permission) => p.id)
            );
          } else {
            rolePermsMap[role.value] = new Set();
          }
        })
      );

      setRolePermissions(rolePermsMap);
      
      if (permsData.permissions.length === 0) {
        setNotification({
          type: 'warning',
          message: 'No permissions found. Please run database migrations to seed permissions.',
        });
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load permissions',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (role: string, permissionId: string) => {
    try {
      setSaving(role);
      setNotification(null);

      const currentPerms = rolePermissions[role] || new Set();
      const newPerms = new Set(currentPerms);
      const isRemoving = newPerms.has(permissionId);

      if (isRemoving) {
        newPerms.delete(permissionId);
      } else {
        newPerms.add(permissionId);
      }

      // Update backend
      const res = await fetch(`/api/admin/permissions/roles/${role}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionIds: Array.from(newPerms),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update permissions');
      }

      // Update local state
      setRolePermissions({
        ...rolePermissions,
        [role]: newPerms,
      });

      // Show success notification
      const permission = permissions.find((p) => p.id === permissionId);
      const roleName = ROLES.find((r) => r.value === role)?.label || role;
      setNotification({
        type: 'success',
        message: `${isRemoving ? 'Revoked' : 'Granted'} "${permission?.name || 'permission'}" for ${roleName}`,
      });

      // Auto-dismiss after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error updating permission:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update permission',
      });
    } finally {
      setSaving(null);
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      const category = perm.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inline Notification */}
      {notification && (
        <div
          className={`rounded-lg p-4 flex items-start gap-3 ${
            notification.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : notification.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : notification.type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                notification.type === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : notification.type === 'warning'
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-red-800 dark:text-red-200'
              }`}
            >
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="sticky left-0 z-10 bg-white dark:bg-gray-900 p-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Permission
              </th>
              {ROLES.map((role) => (
                <th
                  key={role.value}
                  className="min-w-[120px] p-4 text-center text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <Fragment key={category}>
                {/* Category Header */}
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <td
                    colSpan={ROLES.length + 1}
                    className="sticky left-0 p-3 text-sm font-semibold text-gray-900 dark:text-white capitalize"
                  >
                    {category}
                  </td>
                </tr>

                {/* Permission Rows */}
                {perms.map((permission) => (
                  <tr
                    key={permission.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="sticky left-0 bg-white dark:bg-gray-900 p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {permission.name}
                        </p>
                        {permission.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </td>
                    {ROLES.map((role) => (
                      <td key={role.value} className="p-4 text-center">
                        <button
                          onClick={() =>
                            togglePermission(role.value, permission.id)
                          }
                          disabled={saving === role.value}
                          className={cn(
                            'inline-flex h-6 w-6 items-center justify-center rounded transition-colors',
                            rolePermissions[role.value]?.has(permission.id)
                              ? 'bg-primary text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500',
                            saving === role.value
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:opacity-80'
                          )}
                        >
                          {saving === role.value ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : rolePermissions[role.value]?.has(
                              permission.id
                            ) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Click the checkboxes to grant or revoke permissions for each role
      </div>
    </div>
  );
}
