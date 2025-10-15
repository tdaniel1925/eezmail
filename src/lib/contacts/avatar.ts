import type { Contact } from '@/db/schema';

/**
 * Generate avatar URL for a contact
 * Returns the contact's avatar URL if available, otherwise null
 */
export function generateAvatarUrl(contact: Contact): string | null {
  if (contact.avatarUrl) {
    return contact.avatarUrl;
  }
  return null;
}

/**
 * Generate initials from contact name
 * Takes first letter of first name and first letter of last name
 * Falls back to first two letters of display name if names not available
 */
export function generateInitials(
  firstName?: string | null,
  lastName?: string | null,
  displayName?: string | null
): string {
  // Try first name + last name
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  // Try first name only
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }

  // Try last name only
  if (lastName) {
    return lastName.slice(0, 2).toUpperCase();
  }

  // Try display name
  if (displayName) {
    const words = displayName.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }

  // Default fallback
  return '??';
}

/**
 * Get Gravatar URL for an email address
 * Returns a Gravatar URL or null if no email provided
 */
export function getGravatarUrl(
  email?: string,
  size: number = 200
): string | null {
  if (!email) return null;

  // Create MD5-like hash (we'll use a simple hash for demo)
  // In production, you'd want to use a proper MD5 library
  const hash = simpleHash(email.toLowerCase().trim());

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
}

/**
 * Generate a consistent avatar color based on name
 * Uses a hash function to generate a consistent color for the same name
 */
export function generateAvatarColor(name: string): string {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-yellow-500 to-yellow-600',
    'from-red-500 to-red-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-orange-500 to-orange-600',
    'from-cyan-500 to-cyan-600',
  ];

  // Generate hash from name
  const hash = simpleHash(name);
  const index = Math.abs(hash) % colors.length;

  return colors[index];
}

/**
 * Simple hash function for string
 * Returns a numeric hash
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Get the best available name for display
 * Priority: displayName > firstName + lastName > firstName > lastName > email
 */
export function getContactDisplayName(contact: {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  if (contact.displayName) {
    return contact.displayName;
  }

  if (contact.firstName && contact.lastName) {
    return `${contact.firstName} ${contact.lastName}`;
  }

  if (contact.firstName) {
    return contact.firstName;
  }

  if (contact.lastName) {
    return contact.lastName;
  }

  return 'Unnamed Contact';
}

/**
 * Get avatar data for a contact
 * Returns all necessary data for rendering an avatar
 */
export interface AvatarData {
  url: string | null;
  initials: string;
  color: string;
  name: string;
}

export function getContactAvatarData(
  contact: Contact,
  primaryEmail?: string
): AvatarData {
  const name = getContactDisplayName(contact);
  const initials = generateInitials(
    contact.firstName,
    contact.lastName,
    contact.displayName
  );
  const color = generateAvatarColor(name);

  // Try avatar URL first
  let url = generateAvatarUrl(contact);

  // If no avatar URL, try Gravatar
  if (!url && primaryEmail) {
    url = getGravatarUrl(primaryEmail);
  }

  return {
    url,
    initials,
    color,
    name,
  };
}

