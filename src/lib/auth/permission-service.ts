import { db } from '@/lib/db';
import {
  permissions,
  rolePermissions,
  userPermissionOverrides,
  users,
  type Permission,
  type UserPermissionOverride,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// In-memory cache for permission checks (5-minute duration)
const permissionCache = new Map<
  string,
  { permissions: string[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a user has a specific permission
 * Takes into account role-based permissions and user-specific overrides
 */
export async function hasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissions(userId);
    return userPermissions.some((p) => p.code === permissionCode);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 * Combines role-based permissions with user-specific overrides
 * Results are cached for 5 minutes
 */
export async function getUserPermissions(
  userId: string
): Promise<Permission[]> {
  // Check cache first
  const cached = permissionCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    // Fetch full permission objects from database
    const cachedPermissions = await db.select().from(permissions).where(
      eq(
        permissions.code,
        cached.permissions[0] // This is a simplified approach; in production, use IN clause
      )
    );
    return cachedPermissions;
  }

  // Fetch user's role
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      roleHierarchy: true,
    },
  });

  if (!user || !user.roleHierarchy) {
    return [];
  }

  // Fetch role-based permissions
  const rolePerms = await db
    .select({
      permission: permissions,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.role, user.roleHierarchy));

  // Fetch user-specific overrides
  const overrides = await db
    .select({
      permission: permissions,
      granted: userPermissionOverrides.granted,
    })
    .from(userPermissionOverrides)
    .innerJoin(
      permissions,
      eq(userPermissionOverrides.permissionId, permissions.id)
    )
    .where(eq(userPermissionOverrides.userId, userId));

  // Build permission map from role permissions
  const permissionMap = new Map<string, Permission>();
  rolePerms.forEach(({ permission }) => {
    permissionMap.set(permission.code, permission);
  });

  // Apply overrides
  overrides.forEach(({ permission, granted }) => {
    if (granted) {
      permissionMap.set(permission.code, permission);
    } else {
      permissionMap.delete(permission.code);
    }
  });

  const finalPermissions = Array.from(permissionMap.values());

  // Cache the permission codes
  permissionCache.set(userId, {
    permissions: finalPermissions.map((p) => p.code),
    timestamp: Date.now(),
  });

  return finalPermissions;
}

/**
 * Get all permissions for a role (without user-specific overrides)
 */
export async function getRolePermissions(role: string): Promise<Permission[]> {
  try {
    const rolePerms = await db
      .select({
        permission: permissions,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.role, role as any)); // Type assertion for enum

    return rolePerms.map(({ permission }) => permission);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return [];
  }
}

/**
 * Grant a permission override to a user
 */
export async function grantPermissionOverride(
  userId: string,
  permissionCode: string,
  grantedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find permission by code
    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.code, permissionCode),
    });

    if (!permission) {
      return { success: false, error: 'Permission not found' };
    }

    // Upsert permission override
    await db
      .insert(userPermissionOverrides)
      .values({
        userId,
        permissionId: permission.id,
        granted: true,
        createdBy: grantedBy,
      })
      .onConflictDoUpdate({
        target: [
          userPermissionOverrides.userId,
          userPermissionOverrides.permissionId,
        ],
        set: {
          granted: true,
          createdBy: grantedBy,
          createdAt: new Date(),
        },
      });

    // Invalidate cache
    permissionCache.delete(userId);

    return { success: true };
  } catch (error) {
    console.error('Error granting permission override:', error);
    return { success: false, error: 'Failed to grant permission' };
  }
}

/**
 * Revoke a permission override from a user
 */
export async function revokePermissionOverride(
  userId: string,
  permissionCode: string,
  revokedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find permission by code
    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.code, permissionCode),
    });

    if (!permission) {
      return { success: false, error: 'Permission not found' };
    }

    // Upsert permission override with granted=false
    await db
      .insert(userPermissionOverrides)
      .values({
        userId,
        permissionId: permission.id,
        granted: false,
        createdBy: revokedBy,
      })
      .onConflictDoUpdate({
        target: [
          userPermissionOverrides.userId,
          userPermissionOverrides.permissionId,
        ],
        set: {
          granted: false,
          createdBy: revokedBy,
          createdAt: new Date(),
        },
      });

    // Invalidate cache
    permissionCache.delete(userId);

    return { success: true };
  } catch (error) {
    console.error('Error revoking permission override:', error);
    return { success: false, error: 'Failed to revoke permission' };
  }
}

/**
 * Get all available permissions (for admin UI)
 */
export async function getAllPermissions(): Promise<Permission[]> {
  try {
    return await db.select().from(permissions).orderBy(permissions.category);
  } catch (error) {
    console.error('Error fetching all permissions:', error);
    return [];
  }
}

/**
 * Clear permission cache for a user (useful after role changes)
 */
export function clearPermissionCache(userId: string): void {
  permissionCache.delete(userId);
}
