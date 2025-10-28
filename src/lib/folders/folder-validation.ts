/**
 * Folder Validation Service
 *
 * Provides validation and health check functions for email folder structures
 */

import { db } from '@/lib/db';
import { emailFolders, emailAccounts, type CoreFolderType } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  isCriticalFolder,
  getDefaultDisplayName,
} from '@/lib/folders/folder-mapper';

export interface FolderValidationResult {
  isValid: boolean;
  hasInbox: boolean;
  missingCritical: CoreFolderType[];
  missingRecommended: CoreFolderType[];
  warnings: string[];
  errors: string[];
}

/**
 * Validates the folder structure for a specific email account
 *
 * @param accountId - The email account ID to validate
 * @returns FolderValidationResult with detailed validation info
 */
export async function validateAccountFolders(
  accountId: string
): Promise<FolderValidationResult> {
  const result: FolderValidationResult = {
    isValid: true,
    hasInbox: false,
    missingCritical: [],
    missingRecommended: [],
    warnings: [],
    errors: [],
  };

  try {
    // Fetch all folders for this account
    const folders = await db.query.emailFolders.findMany({
      where: eq(emailFolders.accountId, accountId),
      columns: {
        folderType: true,
        isSystemFolder: true,
        name: true,
        syncEnabled: true,
      },
    });

    if (folders.length === 0) {
      result.isValid = false;
      result.errors.push('No folders found for this account');
      return result;
    }

    // Get set of existing folder types
    const existingTypes = new Set(
      folders
        .filter((f) => f.folderType)
        .map((f) => f.folderType as CoreFolderType)
    );

    // Critical folders that MUST exist
    const criticalFolders: CoreFolderType[] = [
      'inbox',
      'sent',
      'drafts',
      'trash',
      'spam',
    ];

    // Check for critical folders
    for (const folderType of criticalFolders) {
      if (!existingTypes.has(folderType)) {
        result.missingCritical.push(folderType);

        if (folderType === 'inbox') {
          result.isValid = false;
          result.errors.push(
            '🚨 CRITICAL: INBOX folder is missing! Email sync cannot function without an inbox.'
          );
        } else {
          result.warnings.push(
            `⚠️ Critical folder missing: ${getDefaultDisplayName(folderType)}`
          );
        }
      }
    }

    // Check if inbox exists
    result.hasInbox = existingTypes.has('inbox');

    // Recommended folders (nice to have)
    const recommendedFolders: CoreFolderType[] = ['archive', 'starred'];

    for (const folderType of recommendedFolders) {
      if (!existingTypes.has(folderType)) {
        result.missingRecommended.push(folderType);
        result.warnings.push(
          `ℹ️ Recommended folder not found: ${getDefaultDisplayName(folderType)}`
        );
      }
    }

    // Check for disabled system folders
    const disabledSystemFolders = folders.filter(
      (f) => f.isSystemFolder && !f.syncEnabled
    );

    if (disabledSystemFolders.length > 0) {
      result.warnings.push(
        `⚠️ ${disabledSystemFolders.length} system folder(s) have sync disabled: ${disabledSystemFolders.map((f) => f.name).join(', ')}`
      );
    }

    // Set overall validity
    if (result.missingCritical.length > 0) {
      result.isValid = result.hasInbox; // Valid if at least inbox exists
    }
  } catch (error) {
    result.isValid = false;
    result.errors.push(
      `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

/**
 * Validates folder structure for all accounts
 * Useful for admin health checks
 *
 * @returns Array of validation results per account
 */
export async function validateAllAccounts(): Promise<
  Array<{
    accountId: string;
    emailAddress: string;
    validation: FolderValidationResult;
  }>
> {
  try {
    const accounts = await db.query.emailAccounts.findMany({
      columns: {
        id: true,
        emailAddress: true,
        isActive: true,
      },
      where: eq(emailAccounts.isActive, true),
    });

    const results = [];

    for (const account of accounts) {
      const validation = await validateAccountFolders(account.id);
      results.push({
        accountId: account.id,
        emailAddress: account.emailAddress,
        validation,
      });
    }

    return results;
  } catch (error) {
    console.error('Failed to validate all accounts:', error);
    return [];
  }
}

/**
 * Attempts to automatically fix common folder issues
 * (Currently logs issues; actual fixes can be added later)
 *
 * @param accountId - The email account ID to fix
 * @returns Success status and list of actions taken
 */
export async function attemptFolderFix(
  accountId: string
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = [];

  try {
    const validation = await validateAccountFolders(accountId);

    if (validation.isValid) {
      actions.push('✅ Folder structure is already valid');
      return { success: true, actions };
    }

    // Log issues (actual fixes would go here in the future)
    if (validation.missingCritical.length > 0) {
      actions.push(
        `ℹ️ Missing critical folders: ${validation.missingCritical.join(', ')}`
      );
      actions.push(
        '💡 Suggestion: Try re-syncing the account or manually refresh folders'
      );
    }

    // For now, we just log. Future: create missing folders, re-sync, etc.
    return { success: false, actions };
  } catch (error) {
    actions.push(
      `❌ Fix attempt failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { success: false, actions };
  }
}

/**
 * Gets a summary of folder health across the system
 * Useful for admin dashboards
 */
export async function getFolderHealthSummary(): Promise<{
  totalAccounts: number;
  validAccounts: number;
  accountsMissingInbox: number;
  accountsWithWarnings: number;
  totalFolders: number;
  systemFolders: number;
  customFolders: number;
}> {
  try {
    const accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.isActive, true),
    });

    const allFolders = await db.query.emailFolders.findMany({});

    let validAccounts = 0;
    let accountsMissingInbox = 0;
    let accountsWithWarnings = 0;

    for (const account of accounts) {
      const validation = await validateAccountFolders(account.id);
      if (validation.isValid) validAccounts++;
      if (!validation.hasInbox) accountsMissingInbox++;
      if (validation.warnings.length > 0) accountsWithWarnings++;
    }

    const systemFolders = allFolders.filter((f) => f.isSystemFolder).length;
    const customFolders = allFolders.filter((f) => !f.isSystemFolder).length;

    return {
      totalAccounts: accounts.length,
      validAccounts,
      accountsMissingInbox,
      accountsWithWarnings,
      totalFolders: allFolders.length,
      systemFolders,
      customFolders,
    };
  } catch (error) {
    console.error('Failed to get folder health summary:', error);
    return {
      totalAccounts: 0,
      validAccounts: 0,
      accountsMissingInbox: 0,
      accountsWithWarnings: 0,
      totalFolders: 0,
      systemFolders: 0,
      customFolders: 0,
    };
  }
}


