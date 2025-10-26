/**
 * Folder Mapping Utilities
 *
 * Provides standardized folder type detection across email providers
 * (Gmail, Microsoft, IMAP, etc.) with fallback logic.
 */

import { type CoreFolderType } from '@/db/schema';

// ============================================================================
// FOLDER NAME MAPPINGS
// ============================================================================

/**
 * Provider-specific folder name variations mapped to core types
 */
export const FOLDER_NAME_MAPPINGS: Record<CoreFolderType, string[]> = {
  inbox: ['inbox', 'INBOX', 'Inbox'],
  sent: [
    'sent',
    'Sent',
    'Sent Items',
    'Sent Mail',
    'Sent Messages',
    'Sent Folder',
    '[Gmail]/Sent Mail',
    'INBOX.Sent',
  ],
  drafts: ['drafts', 'Drafts', 'Draft', '[Gmail]/Drafts', 'INBOX.Drafts'],
  trash: [
    'trash',
    'Trash',
    'Deleted Items',
    'Deleted',
    'Bin',
    'Recycle Bin',
    '[Gmail]/Trash',
    'INBOX.Trash',
    'Deleted Messages',
  ],
  spam: [
    'spam',
    'Spam',
    'Junk',
    'Junk Email',
    'Junk E-mail',
    'Bulk Mail',
    '[Gmail]/Spam',
    'INBOX.Junk',
    'Junk Mail',
  ],
  archive: [
    'archive',
    'Archive',
    'All Mail',
    '[Gmail]/All Mail',
    'INBOX.Archive',
  ],
  starred: ['starred', 'Starred', 'Flagged', '[Gmail]/Starred', 'Important'],
  important: ['important', 'Important', '[Gmail]/Important', 'Priority'],
  all_mail: ['All Mail', '[Gmail]/All Mail'],
  outbox: ['outbox', 'Outbox'],
  custom: [], // User-created folders
};

// ============================================================================
// FOLDER TYPE DETECTION
// ============================================================================

/**
 * Detects the core folder type from a provider folder name
 *
 * @param folderName - The folder name from the provider (e.g., "Sent Items")
 * @param providerType - Optional provider type for provider-specific logic
 * @returns CoreFolderType
 */
export function detectFolderType(
  folderName: string,
  providerType?: 'google' | 'microsoft' | 'imap'
): CoreFolderType {
  if (!folderName) {
    return 'custom';
  }

  const normalizedName = folderName.trim().toLowerCase();

  // Check against all known variations
  for (const [coreType, variations] of Object.entries(FOLDER_NAME_MAPPINGS)) {
    if (coreType === 'custom') continue;

    for (const variation of variations) {
      const normalizedVariation = variation.toLowerCase();

      // Exact match
      if (normalizedName === normalizedVariation) {
        return coreType as CoreFolderType;
      }

      // Contains match (for nested paths like "INBOX.Sent")
      if (normalizedName.includes(normalizedVariation)) {
        return coreType as CoreFolderType;
      }
    }
  }

  // Provider-specific heuristics
  if (providerType === 'google' && normalizedName.startsWith('[gmail]/')) {
    // Gmail-specific folders not in mapping
    return 'custom';
  }

  // Fallback to custom for unknown folders
  return 'custom';
}

/**
 * Checks if a folder type is a standard system folder
 */
export function isSystemFolder(folderType: CoreFolderType): boolean {
  return ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'].includes(
    folderType
  );
}

/**
 * Checks if a folder is critical (must exist)
 */
export function isCriticalFolder(folderType: CoreFolderType): boolean {
  return ['inbox', 'sent', 'drafts', 'trash', 'spam'].includes(folderType);
}

// ============================================================================
// FOLDER DISPLAY PROPERTIES
// ============================================================================

/**
 * Gets the default display name for a folder type
 */
export function getDefaultDisplayName(folderType: CoreFolderType): string {
  const displayNames: Record<CoreFolderType, string> = {
    inbox: 'Inbox',
    sent: 'Sent',
    drafts: 'Drafts',
    trash: 'Trash',
    spam: 'Spam',
    archive: 'Archive',
    starred: 'Starred',
    important: 'Important',
    all_mail: 'All Mail',
    outbox: 'Outbox',
    custom: 'Folder',
  };
  return displayNames[folderType];
}

/**
 * Gets the default icon for a folder type
 */
export function getDefaultIcon(folderType: CoreFolderType): string {
  const icons: Record<CoreFolderType, string> = {
    inbox: 'inbox',
    sent: 'send',
    drafts: 'draft',
    trash: 'delete',
    spam: 'report',
    archive: 'archive',
    starred: 'star',
    important: 'priority_high',
    all_mail: 'all_inbox',
    outbox: 'outbox',
    custom: 'folder',
  };
  return icons[folderType];
}

/**
 * Gets the default sort order for a folder type
 */
export function getDefaultSortOrder(folderType: CoreFolderType): number {
  const order: Record<CoreFolderType, number> = {
    inbox: 1,
    starred: 2,
    important: 3,
    sent: 4,
    drafts: 5,
    archive: 6,
    outbox: 7,
    spam: 98,
    trash: 99,
    all_mail: 100,
    custom: 50,
  };
  return order[folderType];
}

/**
 * Gets the default sync frequency (in minutes) for a folder type
 */
export function getDefaultSyncFrequency(folderType: CoreFolderType): number {
  const frequencies: Record<CoreFolderType, number> = {
    inbox: 5, // Check every 5 minutes
    outbox: 2, // Check frequently for pending sends
    drafts: 10,
    starred: 15,
    important: 10,
    sent: 15,
    spam: 30,
    trash: 60, // Check infrequently
    archive: 60,
    all_mail: 120,
    custom: 30, // Custom folders
  };
  return frequencies[folderType];
}

/**
 * Gets the default sync days back for a folder type
 */
export function getDefaultSyncDaysBack(folderType: CoreFolderType): number {
  const days: Record<CoreFolderType, number> = {
    inbox: 30,
    sent: 30,
    drafts: 365, // Keep all drafts
    starred: 365, // Keep all starred
    important: 90,
    trash: 7, // Only recent trash
    spam: 7, // Only recent spam
    archive: 90,
    all_mail: 30,
    outbox: 1,
    custom: 30, // Custom folders
  };
  return days[folderType];
}

/**
 * Determines if a folder should sync by default
 */
export function shouldSyncByDefault(folderType: CoreFolderType): boolean {
  // Don't sync trash and spam by default to save resources
  return !['trash', 'spam'].includes(folderType);
}

// ============================================================================
// FOLDER VALIDATION
// ============================================================================

export interface FolderValidationResult {
  isValid: boolean;
  missingCritical: CoreFolderType[];
  warnings: string[];
}

/**
 * Validates that an account has all critical folders
 */
export function validateFolderStructure(
  folders: { folderType: CoreFolderType | null }[]
): FolderValidationResult {
  const result: FolderValidationResult = {
    isValid: true,
    missingCritical: [],
    warnings: [],
  };

  const folderTypes = new Set(folders.map((f) => f.folderType).filter(Boolean));

  // Check for critical folders
  const criticalFolders: CoreFolderType[] = [
    'inbox',
    'sent',
    'drafts',
    'trash',
    'spam',
  ];

  for (const folderType of criticalFolders) {
    if (!folderTypes.has(folderType)) {
      result.missingCritical.push(folderType);
      result.isValid = folderType === 'inbox' ? false : result.isValid;

      if (folderType === 'inbox') {
        result.warnings.push('CRITICAL: INBOX folder is missing!');
      } else {
        result.warnings.push(`Warning: ${folderType} folder not detected`);
      }
    }
  }

  return result;
}

// ============================================================================
// PROVIDER-SPECIFIC HELPERS
// ============================================================================

/**
 * Gmail-specific: Detects if a label is a category
 */
export function isGmailCategory(labelName: string): boolean {
  const categories = [
    'CATEGORY_PERSONAL',
    'CATEGORY_SOCIAL',
    'CATEGORY_PROMOTIONS',
    'CATEGORY_UPDATES',
    'CATEGORY_FORUMS',
  ];
  return categories.includes(labelName.toUpperCase());
}

/**
 * Microsoft-specific: Detects if a folder is a well-known folder
 */
export function isMicrosoftWellKnownFolder(folderName: string): boolean {
  const wellKnown = [
    'inbox',
    'sentitems',
    'drafts',
    'deleteditems',
    'junkemail',
    'archive',
    'outbox',
  ];
  return wellKnown.includes(folderName.toLowerCase());
}

/**
 * IMAP-specific: Extracts folder name from full path
 */
export function extractIMAPFolderName(
  path: string,
  delimiter: string = '/'
): string {
  const parts = path.split(delimiter);
  return parts[parts.length - 1];
}

