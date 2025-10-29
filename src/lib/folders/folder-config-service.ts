import {
  detectFolderType,
  shouldSyncByDefault,
  getDefaultIcon,
  getDefaultSortOrder,
  getDefaultSyncFrequency,
  getDefaultSyncDaysBack,
  isSystemFolder,
} from './folder-mapper';
import type { CoreFolderType } from '@/db/schema';

export interface FolderConfiguration {
  folderType: CoreFolderType;
  isSystemFolder: boolean;
  enabled: boolean;
  icon: string;
  sortOrder: number;
  syncFrequencyMinutes: number;
  syncDaysBack: number;
}

/**
 * SINGLE SOURCE OF TRUTH for folder configuration
 * All sync implementations MUST use this function
 */
export function getFolderConfiguration(
  folderName: string,
  provider?: 'google' | 'microsoft' | 'imap'
): FolderConfiguration {
  const folderType = detectFolderType(folderName, provider);

  return {
    folderType,
    isSystemFolder: isSystemFolder(folderType),
    enabled: shouldSyncByDefault(folderType),
    icon: getDefaultIcon(folderType),
    sortOrder: getDefaultSortOrder(folderType),
    syncFrequencyMinutes: getDefaultSyncFrequency(folderType),
    syncDaysBack: getDefaultSyncDaysBack(folderType),
  };
}

/**
 * Prepares complete folder data for database insertion
 * Use this in ALL sync functions to ensure consistency
 */
export function prepareFolderForDatabase(
  folderName: string,
  externalId: string,
  accountId: string,
  userId: string,
  provider?: 'google' | 'microsoft' | 'imap',
  additionalData?: {
    messageCount?: number;
    unreadCount?: number;
    displayName?: string;
    providerId?: string;
  }
) {
  const config = getFolderConfiguration(folderName, provider);

  return {
    accountId,
    userId,
    externalId,
    providerId: additionalData?.providerId,
    name: folderName,
    type: config.folderType,
    folderType: config.folderType,
    isSystemFolder: config.isSystemFolder,
    displayName: additionalData?.displayName || folderName,
    icon: config.icon,
    sortOrder: config.sortOrder,
    syncEnabled: config.enabled,
    syncFrequencyMinutes: config.syncFrequencyMinutes,
    syncDaysBack: config.syncDaysBack,
    messageCount: additionalData?.messageCount || 0,
    unreadCount: additionalData?.unreadCount || 0,
    syncStatus: 'idle' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
