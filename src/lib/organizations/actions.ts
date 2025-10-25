/**
 * Organization Management Actions
 * Create orgs, add members, manage roles
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import {
  organizations,
  organizationMembers,
  users,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// ORGANIZATION CRUD
// ============================================================================

export async function createOrganization(data: {
  name: string;
  slug?: string;
  pricingTier?: string;
}): Promise<{
  success: boolean;
  organizationId?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Create slug from name if not provided
    const slug =
      data.slug ||
      data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if slug is taken
    const existing = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });

    if (existing) {
      return { success: false, error: 'Organization name/slug already taken' };
    }

    // Create organization
    const [org] = await db
      .insert(organizations)
      .values({
        name: data.name,
        slug,
        pricingTier: data.pricingTier || 'standard',
      })
      .returning();

    // Add creator as owner
    await db.insert(organizationMembers).values({
      organizationId: org.id,
      userId: user.id,
      role: 'owner',
      permissions: ['manage_members', 'manage_billing', 'view_all'],
    });

    // Update user's account type
    await db
      .update(users)
      .set({
        accountType: 'business',
        organizationId: org.id,
      })
      .where(eq(users.id, user.id));

    console.log(`✅ Created organization: ${org.name} (${org.id})`);

    return { success: true, organizationId: org.id };
  } catch (error) {
    console.error('❌ Error creating organization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getOrganization(organizationId: string): Promise<{
  success: boolean;
  organization?: typeof organizations.$inferSelect;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user has access to this organization
    const member = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, user.id)
      ),
    });

    if (!member) {
      return { success: false, error: 'Access denied' };
    }

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }

    return { success: true, organization };
  } catch (error) {
    console.error('❌ Error getting organization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// MEMBER MANAGEMENT
// ============================================================================

export async function addMember(
  organizationId: string,
  email: string,
  role: 'admin' | 'manager' | 'member'
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if current user can add members
    const currentMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, user.id)
      ),
    });

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role || '')) {
      return { success: false, error: 'Permission denied' };
    }

    // Find user by email
    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!targetUser) {
      return {
        success: false,
        error: 'User not found. They need to sign up first.',
      };
    }

    // Check if already a member
    const existingMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, targetUser.id)
      ),
    });

    if (existingMember) {
      return { success: false, error: 'User is already a member' };
    }

    // Add member
    await db.insert(organizationMembers).values({
      organizationId,
      userId: targetUser.id,
      role,
      permissions: getRolePermissions(role),
    });

    // Update user's organization
    await db
      .update(users)
      .set({
        accountType: 'business',
        organizationId,
      })
      .where(eq(users.id, targetUser.id));

    console.log(`✅ Added ${email} as ${role} to organization ${organizationId}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error adding member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function removeMember(
  organizationId: string,
  memberId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if current user can remove members
    const currentMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, user.id)
      ),
    });

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role || '')) {
      return { success: false, error: 'Permission denied' };
    }

    // Can't remove owner
    const targetMember = await db.query.organizationMembers.findFirst({
      where: eq(organizationMembers.id, memberId),
    });

    if (targetMember?.role === 'owner') {
      return { success: false, error: 'Cannot remove organization owner' };
    }

    // Remove member
    await db
      .delete(organizationMembers)
      .where(eq(organizationMembers.id, memberId));

    // Update user's organization
    if (targetMember) {
      await db
        .update(users)
        .set({
          accountType: 'individual',
          organizationId: null,
        })
        .where(eq(users.id, targetMember.userId));
    }

    console.log(`✅ Removed member ${memberId} from organization ${organizationId}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error removing member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateMemberRole(
  memberId: string,
  role: 'admin' | 'manager' | 'member'
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get member to update
    const member = await db.query.organizationMembers.findFirst({
      where: eq(organizationMembers.id, memberId),
    });

    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    // Check if current user is owner/admin
    const currentMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, member.organizationId),
        eq(organizationMembers.userId, user.id)
      ),
    });

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role || '')) {
      return { success: false, error: 'Permission denied' };
    }

    // Can't change owner role
    if (member.role === 'owner') {
      return { success: false, error: 'Cannot change owner role' };
    }

    // Update role
    await db
      .update(organizationMembers)
      .set({
        role,
        permissions: getRolePermissions(role),
      })
      .where(eq(organizationMembers.id, memberId));

    console.log(`✅ Updated member ${memberId} role to ${role}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error updating member role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getOrganizationMembers(organizationId: string): Promise<{
  success: boolean;
  members?: Array<{
    id: string;
    userId: string;
    role: string | null;
    email: string;
    fullName: string | null;
    createdAt: Date | null;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user has access
    const currentMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, user.id)
      ),
    });

    if (!currentMember) {
      return { success: false, error: 'Access denied' };
    }

    // Get all members with user details
    const members = await db.query.organizationMembers.findMany({
      where: eq(organizationMembers.organizationId, organizationId),
      with: {
        user: true,
      },
    });

    const membersData = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      email: m.user?.email || '',
      fullName: m.user?.fullName || null,
      createdAt: m.createdAt,
    }));

    return { success: true, members: membersData };
  } catch (error) {
    console.error('❌ Error getting organization members:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getRolePermissions(role: string): string[] {
  switch (role) {
    case 'owner':
      return ['manage_members', 'manage_billing', 'view_all', 'manage_settings'];
    case 'admin':
      return ['manage_members', 'view_all'];
    case 'manager':
      return ['view_all'];
    case 'member':
      return [];
    default:
      return [];
  }
}

