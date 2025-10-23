/**
 * IMAP Email Service
 * Provides IMAP connection for universal email providers
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';

export interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

export interface ImapMessage {
  id: string;
  subject: string;
  from: { email: string; name: string };
  to: Array<{ email: string; name: string }>;
  receivedAt: Date;
  isRead: boolean;
  bodyPreview: string;
  bodyHtml?: string;
  bodyText?: string;
  hasAttachments: boolean;
  folderName: string;
}

export class ImapService {
  private config: ImapConfig;

  constructor(config: ImapConfig) {
    this.config = config;
  }

  /**
   * Test IMAP connection
   */
  async testConnection(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config);

      imap.once('ready', () => {
        console.log('✅ IMAP connection successful');
        imap.end();
        resolve(true);
      });

      imap.once('error', (err: Error) => {
        console.error('❌ IMAP connection failed:', err);
        reject(err);
      });

      imap.once('end', () => {
        console.log('🔌 IMAP connection closed');
      });

      imap.connect();
    });
  }

  /**
   * Get list of mailboxes (folders)
   */
  async getMailboxes(): Promise<
    Array<{ name: string; path: string; delimiter: string }>
  > {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config);
      const mailboxes: Array<{
        name: string;
        path: string;
        delimiter: string;
      }> = [];

      imap.once('ready', () => {
        imap.getBoxes((err, boxes) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          const parseBoxes = (boxes: any, prefix = '') => {
            for (const [name, box] of Object.entries(boxes)) {
              const fullPath = prefix
                ? `${prefix}${box.delimiter}${name}`
                : name;
              mailboxes.push({
                name,
                path: fullPath,
                delimiter: box.delimiter || '/',
              });

              if (box.children) {
                parseBoxes(box.children, fullPath);
              }
            }
          };

          parseBoxes(boxes);
          imap.end();
          resolve(mailboxes);
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Fetch messages from a mailbox
   */
  async fetchMessages(
    mailbox: string = 'INBOX',
    limit: number = 50
  ): Promise<ImapMessage[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config);
      const messages: ImapMessage[] = [];

      imap.once('ready', () => {
        imap.openBox(mailbox, false, (err, box) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          if (box.messages.total === 0) {
            imap.end();
            return resolve([]);
          }

          // Fetch messages: if limit is 0, fetch ALL messages
          let fetchRange: string;
          if (limit === 0 || limit >= box.messages.total) {
            // Fetch all messages
            fetchRange = `1:${box.messages.total}`;
            console.log(`   📥 Fetching ALL ${box.messages.total} messages from ${mailbox}`);
          } else {
            // Fetch the last N messages
            const start = Math.max(1, box.messages.total - limit + 1);
            const end = box.messages.total;
            fetchRange = `${start}:${end}`;
            console.log(`   📥 Fetching last ${limit} messages from ${mailbox}`);
          }

          const fetch = imap.seq.fetch(fetchRange, {
            bodies: ['HEADER', 'TEXT'],
            struct: true,
            markSeen: false,
          });

          fetch.on('message', (msg) => {
            let uid = '';
            let flags: string[] = [];
            let headerBuffer = '';
            let textBuffer = '';

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                if (info.which === 'HEADER') {
                  headerBuffer = buffer;
                } else {
                  textBuffer = buffer;
                }
              });
            });

            msg.once('attributes', (attrs) => {
              uid = attrs.uid.toString();
              flags = attrs.flags || [];
            });

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(headerBuffer + textBuffer);

                const from = parsed.from?.value?.[0] || {
                  address: '',
                  name: '',
                };
                const to =
                  parsed.to?.value?.map((addr) => ({
                    email: addr.address || '',
                    name: addr.name || '',
                  })) || [];

                // Debug logging to track sender/recipient
                console.log(`📧 IMAP Parse - Subject: "${parsed.subject}"`);
                console.log(`   From: ${from.name} <${from.address}>`);
                console.log(
                  `   To: ${to.map((t) => `${t.name} <${t.email}>`).join(', ')}`
                );

                // Fix: Extract name from email address if the display name is wrong
                // This handles reply emails where sender's client copied recipient's name
                let senderName = from.name || '';
                const senderEmail = from.address || '';

                // Check if this is a reply where the display name was incorrectly copied
                // If sender email doesn't match the account user, but name matches account user
                if (senderEmail && senderEmail !== this.config.user) {
                  // Extract account username for comparison
                  const accountLocalPart = this.config.user
                    .split('@')[0]
                    .toLowerCase();
                  const senderNameLower = senderName.toLowerCase();

                  // If the display name contains the account owner's name (like "TRENT DANIEL")
                  // but email is from someone else, extract proper name from email address
                  if (
                    !senderName ||
                    senderNameLower.includes(accountLocalPart) ||
                    senderNameLower.includes('trent') ||
                    senderNameLower.includes('daniel')
                  ) {
                    // Extract name from email: "ed.preble@..." -> "Ed Preble"
                    const emailLocalPart = senderEmail.split('@')[0];
                    senderName = emailLocalPart
                      .split(/[._-]/)
                      .map(
                        (part) =>
                          part.charAt(0).toUpperCase() +
                          part.slice(1).toLowerCase()
                      )
                      .join(' ');
                    console.log(
                      `   ⚠️ Fixed sender name from "${from.name}" to "${senderName}" (reply email fix)`
                    );
                  }
                }

                messages.push({
                  id: uid,
                  subject: parsed.subject || '(No Subject)',
                  from: {
                    email: senderEmail,
                    name: senderName,
                  },
                  to,
                  receivedAt: parsed.date || new Date(),
                  isRead: !flags.includes('\\Unseen'),
                  bodyPreview:
                    parsed.text?.substring(0, 200) || '(No preview available)',
                  bodyHtml: parsed.html || undefined,
                  bodyText: parsed.text || undefined,
                  hasAttachments: (parsed.attachments?.length || 0) > 0,
                  folderName: mailbox,
                });
              } catch (parseError) {
                console.error('Error parsing message:', parseError);
              }
            });
          });

          fetch.once('error', (err: Error) => {
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            imap.end();
            resolve(messages);
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Mark messages as read/unread
   */
  async markAsRead(messageIds: string[], read: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config);

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          const flag = read ? '\\Seen' : '!\\Seen';
          imap.addFlags(messageIds, flag, (err) => {
            imap.end();
            if (err) return reject(err);
            resolve();
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Move message to another folder
   */
  async moveMessage(messageId: string, targetFolder: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config);

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          imap.move(messageId, targetFolder, (err) => {
            imap.end();
            if (err) return reject(err);
            resolve();
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config);

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          imap.addFlags(messageId, '\\Deleted', (err) => {
            if (err) {
              imap.end();
              return reject(err);
            }

            imap.expunge((err) => {
              imap.end();
              if (err) return reject(err);
              resolve();
            });
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }
}

// Alias for compatibility with imports
export { ImapService as IMAPService };
