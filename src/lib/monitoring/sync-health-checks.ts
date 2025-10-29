import { db } from '@/lib/db';
import { emailFolders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function checkFolderSyncHealth(accountId: string) {
  // CRITICAL: Check if inbox is disabled
  const disabledInboxes = await db
    .select()
    .from(emailFolders)
    .where(
      and(
        eq(emailFolders.accountId, accountId),
        eq(emailFolders.folderType, 'inbox'),
        eq(emailFolders.syncEnabled, false)
      )
    );

  if (disabledInboxes.length > 0) {
    console.error('🚨 CRITICAL: Inbox folder is disabled!', {
      accountId,
      folders: disabledInboxes.map((f) => f.name),
    });
    // TODO: Send alert to Sentry or monitoring system
  }

  // Check if spam/trash are enabled (they shouldn't be)
  const wronglyEnabled = await db
    .select()
    .from(emailFolders)
    .where(
      and(
        eq(emailFolders.accountId, accountId),
        eq(emailFolders.syncEnabled, true)
      )
    );

  const badFolders = wronglyEnabled.filter(
    (f) => f.folderType === 'spam' || f.folderType === 'trash'
  );

  if (badFolders.length > 0) {
    console.warn('⚠️ Spam/Trash folders are enabled:', {
      accountId,
      folders: badFolders.map((f) => f.name),
    });
  }

  return {
    healthy: disabledInboxes.length === 0,
    criticalIssues: disabledInboxes,
    warnings: badFolders,
  };
}
