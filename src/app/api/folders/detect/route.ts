/**
 * Folder Detection API
 * GET /api/folders/detect?accountId=xxx
 *
 * Fetches folders from provider and auto-detects types with confidence scores
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { google } from 'googleapis';
import { Client as GraphClient } from '@microsoft/microsoft-graph-client';
import Imap from 'imap';
import {
  detectFolderType,
  calculateConfidence,
  needsReview,
  getDefaultEnabledState,
  sortDetectedFolders,
  type DetectedFolder,
} from '@/lib/folders/folder-detection';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get accountId from query params
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Get account details
    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.id, accountId));

    if (!account || account.userId !== user.id) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch folders based on provider
    let detectedFolders: DetectedFolder[] = [];

    switch (account.provider) {
      case 'google':
      case 'gmail':
        detectedFolders = await detectGmailFolders(account);
        break;

      case 'microsoft':
        detectedFolders = await detectMicrosoftFolders(account);
        break;

      case 'imap':
      case 'yahoo':
        detectedFolders = await detectImapFolders(account);
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported provider: ${account.provider}` },
          { status: 400 }
        );
    }

    // Sort folders for optimal display
    const sortedFolders = sortDetectedFolders(detectedFolders);

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        emailAddress: account.emailAddress,
        provider: account.provider,
      },
      folders: sortedFolders,
      summary: {
        total: sortedFolders.length,
        needsReview: sortedFolders.filter((f) => f.needsReview).length,
        autoEnabled: sortedFolders.filter((f) => f.enabled).length,
      },
    });
  } catch (error) {
    console.error('[Folder Detection API] Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to detect folders',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GMAIL FOLDER DETECTION
// ============================================================================

async function detectGmailFolders(account: any): Promise<DetectedFolder[]> {
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
  const response = await gmail.users.labels.list({ userId: 'me' });
  const labels = response.data.labels || [];

  return labels.map((label) => {
    const detectedType = detectFolderType(label.name || '', 'google');
    const confidence = calculateConfidence(
      label.name || '',
      detectedType,
      'google'
    );

    return {
      id: label.id || '',
      name: label.name || '',
      displayName: label.name || '',
      detectedType,
      confidence,
      messageCount: label.messagesTotal || 0,
      unreadCount: label.messagesUnread || 0,
      needsReview: needsReview(detectedType, confidence),
      enabled: getDefaultEnabledState(detectedType, confidence),
    };
  });
}

// ============================================================================
// MICROSOFT FOLDER DETECTION
// ============================================================================

async function detectMicrosoftFolders(account: any): Promise<DetectedFolder[]> {
  const client = GraphClient.init({
    authProvider: (done) => {
      done(null, account.accessToken);
    },
  });

  const response = await client.api('/me/mailFolders').get();
  const folders = response.value || [];

  return folders.map((folder: any) => {
    const detectedType = detectFolderType(folder.displayName, 'microsoft');
    const confidence = calculateConfidence(
      folder.displayName,
      detectedType,
      'microsoft'
    );

    return {
      id: folder.id,
      name: folder.displayName,
      displayName: folder.displayName,
      detectedType,
      confidence,
      messageCount: folder.totalItemCount || 0,
      unreadCount: folder.unreadItemCount || 0,
      needsReview: needsReview(detectedType, confidence),
      enabled: getDefaultEnabledState(detectedType, confidence),
    };
  });
}

// ============================================================================
// IMAP FOLDER DETECTION
// ============================================================================

async function detectImapFolders(account: any): Promise<DetectedFolder[]> {
  return new Promise((resolve, reject) => {
    const config = JSON.parse(account.imapConfig || '{}');

    const imap = new Imap({
      user: account.emailAddress,
      password: account.accessToken, // For IMAP, password stored as accessToken
      host: config.host || 'imap.gmail.com',
      port: config.port || 993,
      tls: config.tls !== false,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once('ready', () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        const flattenBoxes = (boxTree: any, prefix = ''): DetectedFolder[] => {
          let result: DetectedFolder[] = [];

          for (const [name, box] of Object.entries(boxTree)) {
            const fullPath = prefix ? `${prefix}${box.delimiter}${name}` : name;
            const detectedType = detectFolderType(fullPath, 'imap');
            const confidence = calculateConfidence(
              fullPath,
              detectedType,
              'imap'
            );

            result.push({
              id: fullPath,
              name: fullPath,
              displayName: name,
              detectedType,
              confidence,
              messageCount: 0, // IMAP doesn't provide count without opening box
              unreadCount: 0,
              needsReview: needsReview(detectedType, confidence),
              enabled: getDefaultEnabledState(detectedType, confidence),
            });

            // Recursively add children
            if ((box as any).children) {
              result = result.concat(
                flattenBoxes((box as any).children, fullPath)
              );
            }
          }

          return result;
        };

        const folders = flattenBoxes(boxes);
        imap.end();
        resolve(folders);
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}
