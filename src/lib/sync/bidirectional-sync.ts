/**
 * Bidirectional Email Sync Service
 * Handles syncing email actions (delete, move, mark read/unread) from app to email provider
 */

import { db } from '@/lib/db';
import { emailAccounts, emails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { MicrosoftGraphService } from '@/lib/email/microsoft-graph';
import { google } from 'googleapis';

export type EmailAction =
  | 'delete'
  | 'move'
  | 'mark_read'
  | 'mark_unread'
  | 'flag'
  | 'unflag';

interface SyncActionParams {
  emailId: string;
  action: EmailAction;
  targetFolder?: string; // For move actions
}

/**
 * Sync an email action back to the provider
 * Ensures changes in the app are reflected in the original email account
 */
export async function syncActionToProvider(params: SyncActionParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get email and account info
    const email = await db.query.emails.findFirst({
      where: eq(emails.id, params.emailId),
      with: {
        account: true,
      },
    });

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, email.accountId),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Route to appropriate provider sync
    switch (account.provider) {
      case 'microsoft':
        return await syncToMicrosoft(email, account, params);
      case 'google':
        return await syncToGoogle(email, account, params);
      case 'imap':
        return await syncToIMAP(email, account, params);
      default:
        return {
          success: false,
          error: `Unsupported provider: ${account.provider}`,
        };
    }
  } catch (error) {
    console.error('Error syncing action to provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync action to Microsoft Graph API
 */
async function syncToMicrosoft(
  email: any,
  account: any,
  params: SyncActionParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const msGraph = new MicrosoftGraphService({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`,
    });

    const accessToken = account.accessToken;

    switch (params.action) {
      case 'delete':
        await msGraph.deleteMessage(accessToken, email.providerId);
        break;

      case 'move':
        if (!params.targetFolder) {
          return {
            success: false,
            error: 'Target folder required for move action',
          };
        }
        await msGraph.moveMessage(
          accessToken,
          email.providerId,
          params.targetFolder
        );
        break;

      case 'mark_read':
        await msGraph.markAsRead(accessToken, email.providerId, true);
        break;

      case 'mark_unread':
        await msGraph.markAsRead(accessToken, email.providerId, false);
        break;

      case 'flag':
        await msGraph.flagMessage(accessToken, email.providerId, true);
        break;

      case 'unflag':
        await msGraph.flagMessage(accessToken, email.providerId, false);
        break;

      default:
        return {
          success: false,
          error: `Unsupported action: ${params.action}`,
        };
    }

    return { success: true };
  } catch (error) {
    console.error('Error syncing to Microsoft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync action to Gmail API
 */
async function syncToGoogle(
  email: any,
  account: any,
  params: SyncActionParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    switch (params.action) {
      case 'delete':
        await gmail.users.messages.trash({
          userId: 'me',
          id: email.providerId,
        });
        break;

      case 'move':
        if (!params.targetFolder) {
          return {
            success: false,
            error: 'Target folder required for move action',
          };
        }
        await gmail.users.messages.modify({
          userId: 'me',
          id: email.providerId,
          requestBody: {
            addLabelIds: [params.targetFolder],
          },
        });
        break;

      case 'mark_read':
        await gmail.users.messages.modify({
          userId: 'me',
          id: email.providerId,
          requestBody: {
            removeLabelIds: ['UNREAD'],
          },
        });
        break;

      case 'mark_unread':
        await gmail.users.messages.modify({
          userId: 'me',
          id: email.providerId,
          requestBody: {
            addLabelIds: ['UNREAD'],
          },
        });
        break;

      case 'flag':
        await gmail.users.messages.modify({
          userId: 'me',
          id: email.providerId,
          requestBody: {
            addLabelIds: ['STARRED'],
          },
        });
        break;

      case 'unflag':
        await gmail.users.messages.modify({
          userId: 'me',
          id: email.providerId,
          requestBody: {
            removeLabelIds: ['STARRED'],
          },
        });
        break;

      default:
        return {
          success: false,
          error: `Unsupported action: ${params.action}`,
        };
    }

    return { success: true };
  } catch (error) {
    console.error('Error syncing to Google:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync action to IMAP
 */
async function syncToIMAP(
  email: any,
  account: any,
  params: SyncActionParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const Imap = require('imap');
    const config = JSON.parse(account.imapConfig || '{}');

    const imap = new Imap({
      user: account.emailAddress,
      password: account.accessToken,
      host: config.host || 'imap.gmail.com',
      port: config.port || 993,
      tls: config.tls !== false,
      tlsOptions: { rejectUnauthorized: false },
    });

    return new Promise((resolve) => {
      imap.once('ready', async () => {
        try {
          // Open the mailbox
          imap.openBox(email.folderName || 'INBOX', false, async (err: any) => {
            if (err) {
              resolve({ success: false, error: err.message });
              return;
            }

            switch (params.action) {
              case 'delete':
                imap.addFlags([email.providerId], ['\\Deleted'], (err: any) => {
                  if (err) {
                    resolve({ success: false, error: err.message });
                  } else {
                    imap.expunge();
                    resolve({ success: true });
                  }
                  imap.end();
                });
                break;

              case 'mark_read':
                imap.addFlags([email.providerId], ['\\Seen'], (err: any) => {
                  resolve(
                    err
                      ? { success: false, error: err.message }
                      : { success: true }
                  );
                  imap.end();
                });
                break;

              case 'mark_unread':
                imap.delFlags([email.providerId], ['\\Seen'], (err: any) => {
                  resolve(
                    err
                      ? { success: false, error: err.message }
                      : { success: true }
                  );
                  imap.end();
                });
                break;

              case 'flag':
                imap.addFlags([email.providerId], ['\\Flagged'], (err: any) => {
                  resolve(
                    err
                      ? { success: false, error: err.message }
                      : { success: true }
                  );
                  imap.end();
                });
                break;

              case 'unflag':
                imap.delFlags([email.providerId], ['\\Flagged'], (err: any) => {
                  resolve(
                    err
                      ? { success: false, error: err.message }
                      : { success: true }
                  );
                  imap.end();
                });
                break;

              case 'move':
                if (!params.targetFolder) {
                  resolve({ success: false, error: 'Target folder required' });
                  imap.end();
                  return;
                }
                imap.move(
                  [email.providerId],
                  params.targetFolder,
                  (err: any) => {
                    resolve(
                      err
                        ? { success: false, error: err.message }
                        : { success: true }
                    );
                    imap.end();
                  }
                );
                break;

              default:
                resolve({
                  success: false,
                  error: `Unsupported action: ${params.action}`,
                });
                imap.end();
            }
          });
        } catch (error: any) {
          resolve({ success: false, error: error.message });
        }
      });

      imap.once('error', (err: any) => {
        resolve({ success: false, error: err.message });
      });

      imap.connect();
    });
  } catch (error) {
    console.error('Error syncing to IMAP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch sync multiple actions
 * Useful for bulk operations like "delete all spam"
 */
export async function syncBatchActionsToProvider(
  actions: SyncActionParams[]
): Promise<{
  success: boolean;
  results: Array<{ emailId: string; success: boolean; error?: string }>;
}> {
  const results = await Promise.all(
    actions.map(async (action) => {
      const result = await syncActionToProvider(action);
      return {
        emailId: action.emailId,
        ...result,
      };
    })
  );

  const allSuccessful = results.every((r) => r.success);

  return {
    success: allSuccessful,
    results,
  };
}
