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
 *
 * Includes 100+ variations across multiple languages:
 * - English, Spanish, French, German, Italian, Portuguese
 * - Dutch, Russian, Japanese, Chinese, Korean, Arabic
 * - Provider-specific paths (Gmail, Microsoft, IMAP)
 */
export const FOLDER_NAME_MAPPINGS: Record<CoreFolderType, string[]> = {
  inbox: [
    // English
    'inbox',
    'INBOX',
    'Inbox',
    'InBox',
    // Spanish
    'bandeja de entrada',
    'Bandeja de entrada',
    'Entrada',
    // French
    'boîte de réception',
    'Boîte de réception',
    'Réception',
    // German
    'posteingang',
    'Posteingang',
    'Eingang',
    // Italian
    'posta in arrivo',
    'Posta in arrivo',
    'Arrivo',
    // Portuguese
    'caixa de entrada',
    'Caixa de Entrada',
    'Entrada',
    // Dutch
    'postvak in',
    'Postvak IN',
    // Russian
    'входящие',
    'Входящие',
    // Japanese
    '受信トレイ',
    '受信箱',
    // Chinese
    '收件箱',
    '收件匣',
    // Korean
    '받은 편지함',
    // Arabic
    'صندوق الوارد',
  ],
  sent: [
    // English
    'sent',
    'Sent',
    'Sent Items',
    'Sent Mail',
    'Sent Messages',
    'Sent Folder',
    'SentItems',
    'Sent Email',
    'Outgoing',
    // Spanish
    'enviados',
    'Enviados',
    'Elementos enviados',
    'Correo enviado',
    // French
    'envoyés',
    'Envoyés',
    'Éléments envoyés',
    'Messages envoyés',
    // German
    'gesendete elemente',
    'Gesendete Elemente',
    'Gesendet',
    // Italian
    'posta inviata',
    'Posta Inviata',
    'Inviati',
    'Elementi inviati',
    // Portuguese
    'itens enviados',
    'Itens Enviados',
    'Enviados',
    'Enviadas',
    // Dutch
    'verzonden items',
    'Verzonden Items',
    'Verzonden',
    // Russian
    'отправленные',
    'Отправленные',
    // Japanese
    '送信済みアイテム',
    '送信済み',
    '送信トレイ',
    // Chinese
    '已发送邮件',
    '寄件備份',
    '已发送',
    '寄件匣',
    // Korean
    '보낸 편지함',
    // Arabic
    'العناصر المرسلة',
    'البريد المرسل',
    // Provider-specific
    '[Gmail]/Sent Mail',
    'INBOX.Sent',
    'Sent.',
    '.Sent',
  ],
  drafts: [
    // English
    'drafts',
    'Drafts',
    'Draft',
    'Draft Messages',
    // Spanish
    'borradores',
    'Borradores',
    // French
    'brouillons',
    'Brouillons',
    // German
    'entwürfe',
    'Entwürfe',
    // Italian
    'bozze',
    'Bozze',
    // Portuguese
    'rascunhos',
    'Rascunhos',
    // Dutch
    'concepten',
    'Concepten',
    // Russian
    'черновики',
    'Черновики',
    // Japanese
    '下書き',
    // Chinese
    '草稿',
    '草稿匣',
    // Korean
    '임시 보관함',
    // Arabic
    'المسودات',
    // Provider-specific
    '[Gmail]/Drafts',
    'INBOX.Drafts',
    'Drafts.',
  ],
  trash: [
    // English
    'trash',
    'Trash',
    'Deleted Items',
    'Deleted',
    'Bin',
    'Recycle Bin',
    'Deleted Messages',
    'Deleted Emails',
    'DeletedItems',
    'Rubbish',
    // Spanish
    'papelera',
    'Papelera',
    'elementos eliminados',
    'Elementos eliminados',
    'Eliminados',
    // French
    'corbeille',
    'Corbeille',
    'éléments supprimés',
    'Éléments supprimés',
    'Supprimés',
    // German
    'gelöschte elemente',
    'Gelöschte Elemente',
    'Papierkorb',
    'Gelöscht',
    // Italian
    'posta eliminata',
    'Posta Eliminata',
    'Cestino',
    'Eliminati',
    // Portuguese
    'itens excluídos',
    'Itens Excluídos',
    'Lixeira',
    'Excluídos',
    // Dutch
    'verwijderde items',
    'Verwijderde Items',
    'Prullenbak',
    // Russian
    'удаленные',
    'Удаленные',
    'Корзина',
    // Japanese
    '削除済みアイテム',
    'ごみ箱',
    // Chinese
    '已删除邮件',
    '垃圾桶',
    '已删除',
    '刪除的郵件',
    // Korean
    '지운 편지함',
    '휴지통',
    // Arabic
    'العناصر المحذوفة',
    'سلة المحذوفات',
    // Provider-specific
    '[Gmail]/Trash',
    'INBOX.Trash',
    'Trash.',
    '.Trash',
  ],
  spam: [
    // English (includes "junk" variations since spam folders are often called junk)
    'spam',
    'Spam',
    'Junk',
    'Junk Email',
    'Junk E-mail',
    'Junk Mail',
    'Bulk Mail',
    'JunkEmail',
    'Quarantine',
    // Spanish
    'correo no deseado',
    'Correo no deseado',
    'No deseado',
    // French
    'courrier indésirable',
    'Courrier indésirable',
    'Indésirables',
    // German
    'junk-e-mail',
    'Junk-E-Mail',
    'Spam',
    // Italian
    'posta indesiderata',
    'Posta Indesiderata',
    'Spam',
    // Portuguese
    'lixo eletrônico',
    'Lixo Eletrônico',
    'Spam',
    // Dutch
    'ongewenste e-mail',
    'Ongewenste E-mail',
    'Spam',
    // Russian
    'спам',
    'Спам',
    'Нежелательная почта',
    // Japanese
    '迷惑メール',
    // Chinese
    '垃圾邮件',
    '垃圾郵件',
    // Korean
    '정크 메일',
    // Arabic
    'البريد العشوائي',
    // Provider-specific
    '[Gmail]/Spam',
    'INBOX.Junk',
    'INBOX.Spam',
    'Junk.',
  ],
  outbox: ['Outbox', 'outbox', 'OUTBOX', 'Out Box', 'Enviando', 'Sending'],
  deleted: [
    // Alias for trash - same mappings
    'trash',
    'Trash',
    'Deleted Items',
    'Deleted',
    'Bin',
    'Recycle Bin',
    'papelera',
    'Elementos eliminados',
    'corbeille',
    'Corbeille',
    'papierkorb',
    'Gelöschte Elemente',
    'cestino',
    'lixeira',
    'prullenbak',
    'Verwijderde items',
    'корзина',
    'Удаленные',
    'ごみ箱',
    '垃圾桶',
    '휴지통',
    'سلة المحذوفات',
    '[Gmail]/Trash',
    'INBOX.Trash',
    'Trash.',
  ],
  starred: [
    // English
    'starred',
    'Starred',
    'Flagged',
    'Favorites',
    'Favourites',
    // Spanish
    'destacados',
    'Destacados',
    'Con estrella',
    // French
    'suivis',
    'Suivis',
    'Messages suivis',
    // German
    'markiert',
    'Markiert',
    // Italian
    'speciali',
    'Speciali',
    'Con stella',
    // Portuguese
    'com estrela',
    'Com Estrela',
    'Favoritos',
    // Dutch
    'met ster',
    'Met ster',
    // Russian
    'помеченные',
    'Помеченные',
    // Japanese
    'スター付き',
    // Chinese
    '已加星标',
    '已加星號',
    // Korean
    '별표편지함',
    // Arabic
    'المميزة بنجمة',
    // Provider-specific
    '[Gmail]/Starred',
    'INBOX.Flagged',
  ],
  important: [
    // English
    'important',
    'Important',
    'Priority',
    'VIP',
    // Spanish
    'importante',
    'Importante',
    // French
    'important',
    'Important',
    // German
    'wichtig',
    'Wichtig',
    // Italian
    'importante',
    'Importante',
    // Portuguese
    'importante',
    'Importante',
    // Dutch
    'belangrijk',
    'Belangrijk',
    // Russian
    'важные',
    'Важные',
    // Japanese
    '重要',
    // Chinese
    '重要',
    '重要郵件',
    // Korean
    '중요',
    // Arabic
    'مهم',
    // Provider-specific
    '[Gmail]/Important',
  ],
  all_mail: ['All Mail', '[Gmail]/All Mail', 'INBOX.All Mail'],
  outbox: [
    // English
    'outbox',
    'Outbox',
    'Outgoing',
    'To Send',
    // Spanish
    'bandeja de salida',
    'Bandeja de salida',
    // French
    "boîte d'envoi",
    "Boîte d'envoi",
    // German
    'postausgang',
    'Postausgang',
    // Italian
    'posta in uscita',
    'Posta in uscita',
    // Portuguese
    'caixa de saída',
    'Caixa de Saída',
    // Dutch
    'postvak uit',
    'Postvak UIT',
    // Russian
    'исходящие',
    'Исходящие',
    // Japanese
    '送信トレイ',
    // Chinese
    '发件箱',
    // Korean
    '보낼 편지함',
    // Arabic
    'صندوق الصادر',
  ],
  custom: [], // User-created folders
};

// ============================================================================
// FOLDER TYPE DETECTION
// ============================================================================

/**
 * Detects the core folder type from a provider folder name
 *
 * Uses multiple matching strategies:
 * 1. Exact match (case-insensitive)
 * 2. Contains match (for paths like "INBOX.Sent")
 * 3. Fuzzy match (handles typos, spaces, special chars)
 * 4. Substring match (70% overlap)
 * 5. Provider-specific heuristics
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

  // Strategy 1 & 2: Exact and Contains matching
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

      // Reverse contains (for "Sent" matching "INBOX.Sent Items")
      if (normalizedVariation.includes(normalizedName)) {
        return coreType as CoreFolderType;
      }
    }
  }

  // Strategy 3: Fuzzy matching (remove spaces, dashes, underscores)
  const fuzzyName = normalizedName.replace(/[\s\-_\.]/g, '');

  for (const [coreType, variations] of Object.entries(FOLDER_NAME_MAPPINGS)) {
    if (coreType === 'custom') continue;

    for (const variation of variations) {
      const fuzzyVariation = variation.toLowerCase().replace(/[\s\-_\.]/g, '');

      if (fuzzyName === fuzzyVariation) {
        return coreType as CoreFolderType;
      }

      if (
        fuzzyName.includes(fuzzyVariation) ||
        fuzzyVariation.includes(fuzzyName)
      ) {
        return coreType as CoreFolderType;
      }
    }
  }

  // Strategy 4: Substring similarity (70% match)
  for (const [coreType, variations] of Object.entries(FOLDER_NAME_MAPPINGS)) {
    if (coreType === 'custom') continue;

    for (const variation of variations) {
      const normalizedVariation = variation.toLowerCase();

      if (calculateSimilarity(normalizedName, normalizedVariation) > 0.7) {
        return coreType as CoreFolderType;
      }
    }
  }

  // Strategy 5: Provider-specific heuristics
  if (providerType === 'google' && normalizedName.startsWith('[gmail]/')) {
    // Gmail-specific folders not in mapping
    return 'custom';
  }

  // Fallback to custom for unknown folders
  return 'custom';
}

/**
 * Calculates similarity between two strings (0.0 - 1.0)
 * Uses Jaccard similarity coefficient
 */
function calculateSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));

  const intersection = new Set(Array.from(set1).filter((x) => set2.has(x)));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);

  return intersection.size / union.size;
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
 *
 * @internal DO NOT CALL DIRECTLY IN NEW CODE
 * Use getFolderConfiguration() from folder-config-service.ts instead
 * This ensures all folder configuration logic stays centralized
 *
 * Existing direct usage is being migrated to the centralized service.
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
