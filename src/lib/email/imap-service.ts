/**
 * IMAP Email Integration
 * Universal IMAP support for any email provider
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';

export interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: Date;
  body: string;
  isRead: boolean;
}

export class IMAPService {
  private config: IMAPConfig;

  constructor(config: IMAPConfig) {
    this.config = config;
  }

  /**
   * Test IMAP connection
   */
  async testConnection(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        host: this.config.host,
        port: this.config.port,
        tls: this.config.secure,
        user: this.config.username,
        password: this.config.password,
      });

      imap.once('ready', () => {
        imap.end();
        resolve(true);
      });

      imap.once('error', (err) => {
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Get emails from IMAP
   */
  async getEmails(limit: number = 50): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        host: this.config.host,
        port: this.config.port,
        tls: this.config.secure,
        user: this.config.username,
        password: this.config.password,
      });

      const emails: EmailMessage[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          const fetch = imap.seq.fetch(
            `1:${Math.min(limit, box.messages.total)}`,
            {
              bodies: '',
              struct: true,
            }
          );

          fetch.on('message', (msg, seqno) => {
            let buffer = '';

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });

              stream.once('end', () => {
                simpleParser(buffer, (err, parsed) => {
                  if (err) return;

                  emails.push({
                    id: seqno.toString(),
                    subject: parsed.subject || 'No Subject',
                    from: parsed.from?.text || 'Unknown',
                    date: parsed.date || new Date(),
                    body: parsed.text || parsed.html || '',
                    isRead: false, // IMAP doesn't provide read status by default
                  });
                });
              });
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });

          fetch.once('end', () => {
            imap.end();
            resolve(emails);
          });
        });
      });

      imap.once('error', (err) => {
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        host: this.config.host,
        port: this.config.port,
        tls: this.config.secure,
        user: this.config.username,
        password: this.config.password,
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          imap.addFlags(messageId, ['\\Seen'], (err) => {
            if (err) {
              reject(err);
              return;
            }
            imap.end();
            resolve();
          });
        });
      });

      imap.once('error', (err) => {
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Send email via SMTP (requires separate SMTP configuration)
   */
  async sendEmail(message: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void> {
    // This would require a separate SMTP service
    // For now, we'll throw an error indicating SMTP is needed
    throw new Error('SMTP configuration required for sending emails via IMAP');
  }
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
} as const;
