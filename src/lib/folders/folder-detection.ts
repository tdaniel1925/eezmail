/**
 * Folder Detection & Confidence Calculation
 *
 * Provides intelligence about folder detection confidence
 * for the hybrid confirmation system
 */

import { type CoreFolderType } from '@/db/schema';
import { detectFolderType, FOLDER_NAME_MAPPINGS } from './folder-mapper';

export interface DetectedFolder {
  id: string;
  name: string;
  displayName: string;
  detectedType: CoreFolderType;
  confidence: number;
  messageCount: number;
  unreadCount: number;
  needsReview: boolean;
  enabled: boolean;
}

/**
 * Calculate confidence score for folder type detection
 *
 * @param folderName - Provider folder name
 * @param detectedType - Detected folder type
 * @param provider - Email provider
 * @returns Confidence score (0.0 - 1.0)
 */
export function calculateConfidence(
  folderName: string,
  detectedType: CoreFolderType,
  provider?: 'google' | 'microsoft' | 'imap'
): number {
  if (!folderName || detectedType === 'custom') {
    return 0.5; // Low confidence for custom folders
  }

  const normalizedName = folderName.trim().toLowerCase();
  const variations = FOLDER_NAME_MAPPINGS[detectedType] || [];

  // Exact match = 100% confidence
  for (const variation of variations) {
    if (normalizedName === variation.toLowerCase()) {
      return 1.0;
    }
  }

  // Contains match = 95% confidence
  for (const variation of variations) {
    if (normalizedName.includes(variation.toLowerCase())) {
      return 0.95;
    }
  }

  // Reverse contains = 90% confidence
  for (const variation of variations) {
    if (variation.toLowerCase().includes(normalizedName)) {
      return 0.9;
    }
  }

  // Provider-specific patterns = 85% confidence
  if (provider === 'google' && folderName.startsWith('[Gmail]/')) {
    return 0.85;
  }
  if (provider === 'microsoft' && folderName.includes('Items')) {
    return 0.85;
  }

  // Fuzzy match = 75% confidence
  const fuzzyName = normalizedName.replace(/[\s\-_\.]/g, '');
  for (const variation of variations) {
    const fuzzyVariation = variation.toLowerCase().replace(/[\s\-_\.]/g, '');
    if (fuzzyName === fuzzyVariation) {
      return 0.75;
    }
  }

  // Fallback = 50% confidence
  return 0.5;
}

/**
 * Determine if folder needs user review
 *
 * Folders with low confidence or custom type should be reviewed
 */
export function needsReview(
  detectedType: CoreFolderType,
  confidence: number
): boolean {
  // Custom folders always need review
  if (detectedType === 'custom') {
    return true;
  }

  // Low confidence folders need review
  if (confidence < 0.8) {
    return true;
  }

  return false;
}

/**
 * Get display properties for folder type
 */
export function getFolderTypeDisplay(folderType: CoreFolderType): {
  label: string;
  icon: string;
  color: string;
} {
  const displays: Record<
    CoreFolderType,
    { label: string; icon: string; color: string }
  > = {
    inbox: { label: 'Inbox', icon: '📥', color: 'blue' },
    sent: { label: 'Sent', icon: '📤', color: 'green' },
    drafts: { label: 'Drafts', icon: '📝', color: 'yellow' },
    trash: { label: 'Trash', icon: '🗑️', color: 'red' },
    spam: { label: 'Spam', icon: '⚠️', color: 'orange' },
    archive: { label: 'Archive', icon: '📦', color: 'purple' },
    starred: { label: 'Starred', icon: '⭐', color: 'yellow' },
    important: { label: 'Important', icon: '❗', color: 'red' },
    all_mail: { label: 'All Mail', icon: '📧', color: 'gray' },
    outbox: { label: 'Outbox', icon: '📬', color: 'blue' },
    custom: { label: 'Custom Folder', icon: '📁', color: 'gray' },
  };

  return displays[folderType] || displays.custom;
}

/**
 * Sort folders for optimal display order
 *
 * Priority order:
 * 1. System folders (inbox, sent, drafts, etc.)
 * 2. High confidence folders
 * 3. Low confidence folders needing review
 */
export function sortDetectedFolders(
  folders: DetectedFolder[]
): DetectedFolder[] {
  const systemFolders = ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'];

  return [...folders].sort((a, b) => {
    // System folders first
    const aIsSystem = systemFolders.includes(a.detectedType);
    const bIsSystem = systemFolders.includes(b.detectedType);

    if (aIsSystem && !bIsSystem) return -1;
    if (!aIsSystem && bIsSystem) return 1;

    // Then by confidence (high to low)
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }

    // Finally by message count (high to low)
    return b.messageCount - a.messageCount;
  });
}

/**
 * Get recommended folders to enable by default
 *
 * - Always enable system folders (inbox, sent, drafts)
 * - Enable high-confidence folders
 * - Disable spam/trash to save resources
 * - Disable low-confidence custom folders
 */
export function getDefaultEnabledState(
  detectedType: CoreFolderType,
  confidence: number
): boolean {
  // Critical system folders - always enable
  if (['inbox', 'sent', 'drafts'].includes(detectedType)) {
    return true;
  }

  // Spam/trash - disable by default to save resources
  if (['spam', 'trash'].includes(detectedType)) {
    return false;
  }

  // High confidence folders - enable
  if (confidence >= 0.8) {
    return true;
  }

  // Low confidence custom folders - disable
  if (detectedType === 'custom' && confidence < 0.8) {
    return false;
  }

  // Everything else - enable
  return true;
}
