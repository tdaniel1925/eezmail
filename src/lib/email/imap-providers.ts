/**
 * IMAP Provider Configurations
 * Client-safe configuration for common email providers
 */

export interface IMAPProviderConfig {
  host: string;
  port: number;
  secure: boolean;
}

/**
 * Predefined IMAP configurations for common providers
 */
export const IMAP_PROVIDERS = {
  outlook: {
    host: 'outlook.office365.com',
    port: 993,
    secure: true,
  },
  gmail: {
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
  },
  yahoo: {
    host: 'imap.mail.yahoo.com',
    port: 993,
    secure: true,
  },
  icloud: {
    host: 'imap.mail.me.com',
    port: 993,
    secure: true,
  },
  fastmail: {
    host: 'imap.fastmail.com',
    port: 993,
    secure: true,
  },
  custom: {
    host: '',
    port: 993,
    secure: true,
  },
} as const;
