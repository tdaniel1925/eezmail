import { describe, test, expect } from '@jest/globals';
import {
  getFolderConfiguration,
  prepareFolderForDatabase,
} from '@/lib/folders/folder-config-service';

describe('Folder Configuration Service', () => {
  test('getFolderConfiguration returns complete config', () => {
    const config = getFolderConfiguration('Inbox');

    expect(config).toHaveProperty('folderType');
    expect(config).toHaveProperty('enabled');
    expect(config).toHaveProperty('icon');
    expect(config).toHaveProperty('sortOrder');
    expect(config).toHaveProperty('syncFrequencyMinutes');
    expect(config).toHaveProperty('syncDaysBack');
  });

  test('prepareFolderForDatabase returns insertable data', () => {
    const data = prepareFolderForDatabase(
      'Inbox',
      'ext-123',
      'account-456',
      'user-789'
    );

    expect(data.folderType).toBe('inbox');
    expect(data.syncEnabled).toBe(true);
    expect(data.accountId).toBe('account-456');
    expect(data.userId).toBe('user-789');
    expect(data.externalId).toBe('ext-123');
  });

  test('Spam and trash folders are disabled by default', () => {
    const spam = prepareFolderForDatabase('Spam', 'ext-1', 'acc-1', 'user-1');
    const trash = prepareFolderForDatabase('Trash', 'ext-2', 'acc-1', 'user-1');

    expect(spam.syncEnabled).toBe(false);
    expect(trash.syncEnabled).toBe(false);
  });
});
