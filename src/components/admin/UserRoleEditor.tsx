'use client';

import { useState, useEffect } from 'react';
import { Check, X, Loader2, Save, Shield, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface UserRoleEditorProps {
  userId: string;
  currentRole: string;
  onRoleChange?: (newRole: string) => void;
}

const ROLES = [
  { value: 'user', label: 'User', tier: 'Individual' },
  { value: 'team_user', label: 'Team User', tier: 'Team' },
  { value: 'team_admin', label: 'Team Admin', tier: 'Team' },
  { value: 'team_super_admin', label: 'Team Super Admin', tier: 'Team' },
  { value: 'enterprise_user', label: 'Enterprise User', tier: 'Enterprise' },
  { value: 'enterprise_admin', label: 'Enterprise Admin', tier: 'Enterprise' },
  {
    value: 'enterprise_super_admin',
    label: 'Enterprise Super Admin',
    tier: 'Enterprise',
  },
  { value: 'system_admin', label: 'System Admin', tier: 'System' },
  { value: 'system_super_admin', label: 'System Super Admin', tier: 'System' },
];

export function UserRoleEditor({
  userId,
  currentRole,
  onRoleChange,
}: UserRoleEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, [userId, selectedRole]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all permissions
      const allRes = await fetch('/api/admin/permissions');
      if (allRes.ok) {
        const allData = await allRes.json();
        setAllPermissions(allData.permissions);
      }

      // Load user's current permissions
      const userRes = await fetch(`/api/admin/permissions/users/${userId}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserPermissions(userData.permissions);
      }

      // Load role permissions
      const roleRes = await fetch(
        `/api/admin/permissions/roles/${selectedRole}`
      );
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        setRolePermissions(roleData.permissions);
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    try {
      setSaving(true);
      setError(null);

      // TODO: Add API endpoint to update user role
      // For now, just update local state
      setSelectedRole(newRole);
      onRoleChange?.(newRole);

      // Reload permissions for new role
      await loadPermissions();
    } catch (err) {
      console.error('Error changing role:', err);
      setError('Failed to change role');
    } finally {
      setSaving(false);
    }
  };

  const togglePermissionOverride = async (
    permissionCode: string,
    grant: boolean
  ) => {
    try {
      const method = grant ? 'POST' : 'DELETE';
      const res = await fetch(`/api/admin/permissions/users/${userId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionCode }),
      });

      if (!res.ok) throw new Error('Failed to update permission');

      // Update local state
      const newOverrides = new Map(overrides);
      if (grant) {
        newOverrides.set(permissionCode, true);
      } else {
        newOverrides.delete(permissionCode);
      }
      setOverrides(newOverrides);

      // Reload permissions
      await loadPermissions();
    } catch (err) {
      console.error('Error toggling permission:', err);
      setError('Failed to update permission');
    }
  };

  // Group permissions by category
  const groupedPermissions = allPermissions.reduce(
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

  // Check if permission is inherited from role
  const isInheritedPermission = (permCode: string) => {
    return rolePermissions.some((p) => p.code === permCode);
  };

  // Check if user has permission (role + overrides)
  const hasPermission = (permCode: string) => {
    return userPermissions.some((p) => p.code === permCode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Role Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          User Role
        </label>
        <select
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={saving}
          className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50"
        >
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label} ({role.tier})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Changing the role will update inherited permissions
        </p>
      </div>

      {/* Permission Overrides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Permission Overrides
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Inherited
            </span>
            {' | '}
            <span className="inline-flex items-center gap-1">
              <Plus className="h-3 w-3" />
              Granted
            </span>
            {' | '}
            <span className="inline-flex items-center gap-1">
              <Trash2 className="h-3 w-3" />
              Revoked
            </span>
          </p>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {category}
              </h4>
              <div className="space-y-1">
                {perms.map((permission) => {
                  const inherited = isInheritedPermission(permission.code);
                  const has = hasPermission(permission.code);
                  const isOverride = !inherited && has;

                  return (
                    <div
                      key={permission.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border transition-colors',
                        inherited
                          ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                          : isOverride
                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {permission.name}
                          </p>
                          {inherited && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              <Shield className="h-3 w-3" />
                              Inherited
                            </span>
                          )}
                          {isOverride && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                              <Plus className="h-3 w-3" />
                              Override
                            </span>
                          )}
                        </div>
                        {permission.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {permission.description}
                          </p>
                        )}
                      </div>

                      {!inherited && (
                        <button
                          onClick={() =>
                            togglePermissionOverride(permission.code, !has)
                          }
                          className={cn(
                            'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                            has
                              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                              : 'bg-primary text-white hover:bg-primary/80'
                          )}
                        >
                          {has ? 'Revoke' : 'Grant'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
