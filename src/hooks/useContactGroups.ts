'use client';

import useSWR from 'swr';
import type {
  ContactGroupWithCount,
  ContactGroup,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMembersRequest,
  RemoveMembersRequest,
} from '@/types/contact-groups';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

/**
 * Hook to fetch all groups for the current user
 */
export function useContactGroups() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    groups: ContactGroupWithCount[];
  }>('/api/contacts/groups', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    groups: data?.groups || [],
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single group with members
 */
export function useContactGroup(groupId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    group: ContactGroup & {
      members: Array<{
        id: string;
        contactId: string;
        firstName?: string | null;
        lastName?: string | null;
        displayName?: string | null;
        company?: string | null;
        email?: string | null;
      }>;
    };
  }>(groupId ? `/api/contacts/groups/${groupId}` : null, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    group: data?.group || null,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Create a new group
 */
export async function createContactGroup(
  data: CreateGroupRequest
): Promise<ContactGroup> {
  const res = await fetch('/api/contacts/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create group');
  }

  const result = await res.json();
  return result.group;
}

/**
 * Update an existing group
 */
export async function updateContactGroup(
  groupId: string,
  data: UpdateGroupRequest
): Promise<ContactGroup> {
  const res = await fetch(`/api/contacts/groups/${groupId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update group');
  }

  const result = await res.json();
  return result.group;
}

/**
 * Delete a group
 */
export async function deleteContactGroup(groupId: string): Promise<void> {
  const res = await fetch(`/api/contacts/groups/${groupId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete group');
  }
}

/**
 * Add members to a group
 */
export async function addMembersToContactGroup(
  groupId: string,
  data: AddMembersRequest
): Promise<{ added: number; errors: number }> {
  const res = await fetch(`/api/contacts/groups/${groupId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add members');
  }

  const result = await res.json();
  return { added: result.added, errors: result.errors };
}

/**
 * Remove members from a group
 */
export async function removeMembersFromContactGroup(
  groupId: string,
  data: RemoveMembersRequest
): Promise<{ removed: number }> {
  const res = await fetch(`/api/contacts/groups/${groupId}/members`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to remove members');
  }

  const result = await res.json();
  return { removed: result.removed };
}

