'use server';

import { db } from '@/lib/db';
import { emailRules, emailSignatures, customFolders, emailSettings } from '@/db/schema';
import { eq, or, ilike, desc } from 'drizzle-orm';

/**
 * Search over user settings, rules, signatures, and folders
 */
export async function searchSettingsRAG(
  query: string,
  userId: string
): Promise<{
  rules: any[];
  signatures: any[];
  folders: any[];
  settings: any;
  summary: string;
}> {
  try {
    const searchTerms = query.toLowerCase().split(' ');

    // Search rules
    const foundRules = await db.query.emailRules.findMany({
      where: eq(emailRules.userId, userId),
      limit: 10,
    });

    const relevantRules = foundRules.filter((rule: any) => {
      const ruleText = [
        rule.name,
        JSON.stringify(rule.conditions),
        JSON.stringify(rule.actions),
      ]
        .join(' ')
        .toLowerCase();

      return searchTerms.some(term => ruleText.includes(term));
    });

    // Search signatures
    const foundSignatures = await db.query.emailSignatures.findMany({
      where: eq(emailSignatures.userId, userId),
      limit: 10,
    });

    const relevantSignatures = foundSignatures.filter((sig: any) => {
      const sigText = [sig.name, sig.textContent || '', sig.htmlContent || '']
        .join(' ')
        .toLowerCase();

      return searchTerms.some(term => sigText.includes(term));
    });

    // Search folders
    const foundFolders = await db.query.customFolders.findMany({
      where: eq(customFolders.userId, userId),
      limit: 20,
    });

    const relevantFolders = foundFolders.filter((folder: any) => {
      const folderText = [folder.name, folder.description || ''].join(' ').toLowerCase();

      return searchTerms.some(term => folderText.includes(term));
    });

    // Get email settings (if query is about settings)
    let userSettings = null;
    if (
      query.toLowerCase().includes('setting') ||
      query.toLowerCase().includes('preference') ||
      query.toLowerCase().includes('config')
    ) {
      // Get first account's settings
      const accounts = await db.query.emailAccounts.findMany({
        where: eq(emailRules.userId, userId), // Note: Using emailRules schema as proxy
        limit: 1,
      });

      if (accounts.length > 0) {
        const settings = await db.query.emailSettings.findFirst({
          where: eq(emailSettings.accountId, accounts[0].id),
        });
        userSettings = settings;
      }
    }

    const summary = generateSettingsSummary(
      relevantRules,
      relevantSignatures,
      relevantFolders,
      userSettings,
      query
    );

    return {
      rules: relevantRules,
      signatures: relevantSignatures,
      folders: relevantFolders,
      settings: userSettings,
      summary,
    };
  } catch (error) {
    console.error('Error in settings semantic search:', error);
    return {
      rules: [],
      signatures: [],
      folders: [],
      settings: null,
      summary: '',
    };
  }
}

/**
 * Get all rules for context
 */
export async function getUserRulesContext(userId: string): Promise<string> {
  try {
    const rules = await db.query.emailRules.findMany({
      where: eq(emailRules.userId, userId),
      orderBy: [desc(emailRules.priority)],
    });

    if (rules.length === 0) {
      return 'No email rules configured.';
    }

    const activeRules = rules.filter((r: any) => r.isActive);
    const summary = `${activeRules.length} active rules, ${rules.length - activeRules.length} inactive`;

    return `Email rules: ${summary}`;
  } catch (error) {
    console.error('Error getting user rules context:', error);
    return '';
  }
}

/**
 * Get signatures for context
 */
export async function getUserSignaturesContext(userId: string): Promise<string> {
  try {
    const signatures = await db.query.emailSignatures.findMany({
      where: eq(emailSignatures.userId, userId),
    });

    if (signatures.length === 0) {
      return 'No email signatures configured.';
    }

    const defaultSig = signatures.find((s: any) => s.isDefault);
    const summary = defaultSig
      ? `${signatures.length} signatures (default: "${defaultSig.name}")`
      : `${signatures.length} signatures`;

    return `Email signatures: ${summary}`;
  } catch (error) {
    console.error('Error getting user signatures context:', error);
    return '';
  }
}

/**
 * Get custom folders for context
 */
export async function getUserFoldersContext(userId: string): Promise<string> {
  try {
    const folders = await db.query.customFolders.findMany({
      where: eq(customFolders.userId, userId),
    });

    if (folders.length === 0) {
      return 'No custom folders.';
    }

    const folderNames = folders.map((f: any) => f.name).join(', ');
    return `Custom folders: ${folderNames}`;
  } catch (error) {
    console.error('Error getting user folders context:', error);
    return '';
  }
}

/**
 * Generate human-readable summary
 */
function generateSettingsSummary(
  rules: any[],
  signatures: any[],
  folders: any[],
  settings: any,
  query: string
): string {
  const parts: string[] = [];

  if (rules.length > 0) {
    const ruleNames = rules.map(r => r.name).join(', ');
    parts.push(`Rules: ${ruleNames}`);
  }

  if (signatures.length > 0) {
    const sigNames = signatures.map(s => s.name).join(', ');
    parts.push(`Signatures: ${sigNames}`);
  }

  if (folders.length > 0) {
    const folderNames = folders.map(f => f.name).join(', ');
    parts.push(`Folders: ${folderNames}`);
  }

  if (settings) {
    parts.push(
      `Settings: ${settings.emailMode || 'traditional'} mode, ${settings.emailsPerPage || 50} emails per page`
    );
  }

  if (parts.length === 0) {
    return `No settings, rules, signatures, or folders found matching "${query}".`;
  }

  return `Found: ${parts.join(' | ')}`;
}

