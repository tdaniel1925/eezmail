'use client';

import useSWR from 'swr';
import type {
  ContactTagWithCount,
  ContactTag,
  CreateTagRequest,
  UpdateTagRequest,
  AssignTagsRequest,
  RemoveTagsRequest,
} from '@/types/contact-groups';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

/**
 * Hook to fetch all tags for the current user with usage counts
 */
export function useContactTags() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    tags: ContactTagWithCount[];
  }>('/api/contacts/tags', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    tags: data?.tags || [],
    isLoading,
    error,
    mutate,
  };
}

/**
 * Create a new tag
 */
export async function createContactTag(
  data: CreateTagRequest
): Promise<ContactTag> {
  const res = await fetch('/api/contacts/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create tag');
  }

  const result = await res.json();
  return result.tag;
}

/**
 * Update an existing tag
 */
export async function updateContactTag(
  tagId: string,
  data: UpdateTagRequest
): Promise<ContactTag> {
  const res = await fetch(`/api/contacts/tags/${tagId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update tag');
  }

  const result = await res.json();
  return result.tag;
}

/**
 * Delete a tag
 */
export async function deleteContactTag(tagId: string): Promise<void> {
  const res = await fetch(`/api/contacts/tags/${tagId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete tag');
  }
}

/**
 * Assign tags to a contact
 */
export async function assignTagsToContact(
  contactId: string,
  data: AssignTagsRequest
): Promise<{ assigned: number; errors: number }> {
  const res = await fetch(`/api/contacts/${contactId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to assign tags');
  }

  const result = await res.json();
  return { assigned: result.assigned, errors: result.errors };
}

/**
 * Remove tags from a contact
 */
export async function removeTagsFromContact(
  contactId: string,
  data: RemoveTagsRequest
): Promise<{ removed: number }> {
  const res = await fetch(`/api/contacts/${contactId}/tags`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to remove tags');
  }

  const result = await res.json();
  return { removed: result.removed };
}

