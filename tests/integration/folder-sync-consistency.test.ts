import { describe, test, expect } from '@jest/globals';
import { getFolderConfiguration } from '@/lib/folders/folder-config-service';

describe('Folder Sync Consistency', () => {
  test('Inbox folders are always enabled', () => {
    const config = getFolderConfiguration('Inbox');
    expect(config.enabled).toBe(true);
    expect(config.folderType).toBe('inbox');
  });

  test('Spam folders are always disabled by default', () => {
    const config = getFolderConfiguration('Spam');
    expect(config.enabled).toBe(false);
    expect(config.folderType).toBe('spam');
  });

  test('Trash folders are always disabled by default', () => {
    const config = getFolderConfiguration('Deleted Items');
    expect(config.enabled).toBe(false);
    expect(config.folderType).toBe('trash');
  });

  test('Sent folders are enabled', () => {
    const config = getFolderConfiguration('Sent Items');
    expect(config.enabled).toBe(true);
    expect(config.folderType).toBe('sent');
  });

  test('Configuration is consistent across providers', () => {
    const microsoft = getFolderConfiguration('Sent Items', 'microsoft');
    const gmail = getFolderConfiguration('Sent Mail', 'google');
    const imap = getFolderConfiguration('Sent', 'imap');

    expect(microsoft.folderType).toBe('sent');
    expect(gmail.folderType).toBe('sent');
    expect(imap.folderType).toBe('sent');

    expect(microsoft.enabled).toBe(gmail.enabled);
    expect(gmail.enabled).toBe(imap.enabled);
  });
});
