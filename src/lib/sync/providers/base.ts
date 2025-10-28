/**
 * Base Provider Interface
 * All sync providers (Microsoft, Gmail, IMAP) must implement this interface
 */

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface SyncProvider {
  name: string;
  refreshToken(): Promise<string>;
  fetchFolders(): Promise<ProviderFolder[]>;
  fetchEmails(folderId: string, cursor?: string): Promise<{
    emails: ProviderEmail[];
    nextCursor?: string;
    hasMore: boolean;
  }>;
}

export interface ProviderFolder {
  id: string;
  name: string;
  totalMessages: number;
  unreadMessages: number;
}

export interface ProviderEmail {
  id: string;
  messageId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  receivedAt: Date;
  sentAt?: Date;
  bodyHtml?: string;
  bodyText?: string;
  snippet: string;
  isRead: boolean;
  hasAttachments: boolean;
  labels?: string[];
}

