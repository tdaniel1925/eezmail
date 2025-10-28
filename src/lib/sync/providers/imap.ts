import { SyncProvider, ProviderFolder, ProviderEmail, EmailAddress } from './base';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { promisify } from 'util';

/**
 * IMAP Provider
 * Handles IMAP connections for generic email providers (Yahoo, etc.)
 */
export class ImapProvider implements SyncProvider {
  name = 'imap';
  private imap: Imap;

  constructor(
    private config: {
      user: string;
      password: string;
      host: string;
      port: number;
      tls: boolean;
    },
    private accountId: string
  ) {
    this.imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false },
    });
  }

  /**
   * IMAP doesn't use OAuth, so no token refresh needed
   */
  async refreshToken(): Promise<string> {
    // IMAP uses username/password, no token refresh needed
    return this.config.password;
  }

  /**
   * Fetch all IMAP folders/mailboxes
   */
  async fetchFolders(): Promise<ProviderFolder[]> {
    console.log('📁 Fetching IMAP folders...');

    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.imap.getBoxes((err, boxes) => {
          if (err) {
            this.imap.end();
            reject(err);
            return;
          }

          const folders: ProviderFolder[] = [];
          const flattenBoxes = (boxMap: any, prefix = '') => {
            for (const [name, box] of Object.entries(boxMap)) {
              const fullName = prefix ? `${prefix}${box.delimiter}${name}` : name;
              folders.push({
                id: fullName,
                name: fullName,
                totalMessages: (box as any).messages?.total || 0,
                unreadMessages: (box as any).messages?.unseen || 0,
              });

              if ((box as any).children) {
                flattenBoxes((box as any).children, fullName);
              }
            }
          };

          flattenBoxes(boxes);
          this.imap.end();
          console.log(`✅ Found ${folders.length} IMAP folders`);
          resolve(folders);
        });
      });

      this.imap.once('error', (err) => {
        console.error('❌ IMAP connection error:', err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  /**
   * Fetch emails from an IMAP folder
   */
  async fetchEmails(
    folderId: string,
    cursor?: string
  ): Promise<{
    emails: ProviderEmail[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    console.log(`📧 Fetching emails from IMAP folder: ${folderId}`);

    // Cursor for IMAP is the last UID fetched
    const lastUid = cursor ? parseInt(cursor) : 0;

    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.imap.openBox(folderId, true, async (err, box) => {
          if (err) {
            this.imap.end();
            reject(err);
            return;
          }

          // Fetch UIDs greater than cursor
          const searchCriteria = lastUid > 0 ? [['UID', `${lastUid + 1}:*`]] : ['ALL'];

          this.imap.search(searchCriteria, (err, results) => {
            if (err) {
              this.imap.end();
              reject(err);
              return;
            }

            if (results.length === 0) {
              this.imap.end();
              resolve({ emails: [], nextCursor: undefined, hasMore: false });
              return;
            }

            // Fetch only first 100 messages
            const uidsToFetch = results.slice(0, 100);
            const fetch = this.imap.fetch(uidsToFetch, {
              bodies: '',
              struct: true,
            });

            const emails: ProviderEmail[] = [];
            const errors: Error[] = [];

            fetch.on('message', (msg, seqno) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error(`⚠️ Failed to parse message ${seqno}:`, err);
                    errors.push(err);
                    return;
                  }

                  try {
                    const email = this.mapToProviderEmail(parsed);
                    emails.push(email);
                  } catch (mapError) {
                    console.error(`⚠️ Failed to map message ${seqno}:`, mapError);
                    errors.push(mapError as Error);
                  }
                });
              });
            });

            fetch.once('error', (fetchErr) => {
              console.error('❌ IMAP fetch error:', fetchErr);
              this.imap.end();
              reject(fetchErr);
            });

            fetch.once('end', () => {
              this.imap.end();

              const lastFetchedUid = Math.max(...uidsToFetch);
              const hasMore = results.length > uidsToFetch.length;

              console.log(
                `✅ Fetched ${emails.length} emails from IMAP folder ${folderId}`
              );

              resolve({
                emails,
                nextCursor: hasMore ? lastFetchedUid.toString() : undefined,
                hasMore,
              });
            });
          });
        });
      });

      this.imap.once('error', (err) => {
        console.error('❌ IMAP connection error:', err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  /**
   * Map parsed mail to standard ProviderEmail format
   */
  private mapToProviderEmail(parsed: ParsedMail): ProviderEmail {
    return {
      id: parsed.messageId || `${Date.now()}-${Math.random()}`,
      messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
      subject: parsed.subject || '(No Subject)',
      from: this.mapAddress(parsed.from?.value[0]),
      to: parsed.to?.value.map((a) => this.mapAddress(a)) || [],
      cc: parsed.cc?.value.map((a) => this.mapAddress(a)),
      receivedAt: parsed.date || new Date(),
      sentAt: parsed.date,
      bodyHtml: parsed.html || undefined,
      bodyText: parsed.text || undefined,
      snippet: parsed.text?.substring(0, 150) || '',
      isRead: false, // IMAP doesn't provide read status in simple parser
      hasAttachments: (parsed.attachments?.length || 0) > 0,
    };
  }

  /**
   * Map mailparser address to EmailAddress format
   */
  private mapAddress(addr: any): EmailAddress {
    if (!addr) return { email: '' };
    return {
      email: addr.address || '',
      name: addr.name,
    };
  }
}

