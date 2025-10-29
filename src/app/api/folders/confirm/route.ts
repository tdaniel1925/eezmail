/**
 * Folder Confirmation API
 * POST /api/folders/confirm
 *
 * Saves user-confirmed folder mappings and creates folders in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { emailAccounts, emailFolders, folderMappings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { CoreFolderType } from '@/db/schema';
import { shouldSyncByDefault } from '@/lib/folders/folder-mapper';

interface ConfirmedFolder {
  id: string;
  name: string;
  displayName: string;
  confirmedType: CoreFolderType;
  messageCount: number;
  unreadCount: number;
  enabled: boolean;
  wasModified: boolean; // Whether user changed the auto-detected type
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { accountId, folders } = body as {
      accountId: string;
      folders: ConfirmedFolder[];
    };

    if (!accountId || !folders || !Array.isArray(folders)) {
      return NextResponse.json(
        { error: 'accountId and folders array are required' },
        { status: 400 }
      );
    }

    // Verify account ownership
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

    console.log(
      `[Folder Confirmation] Saving ${folders.length} folders for account ${accountId}`
    );

    // Process each folder
    const createdFolders = [];
    const createdMappings = [];

    for (const folder of folders) {
      if (!folder.enabled) {
        console.log(
          `[Folder Confirmation] Skipping disabled folder: ${folder.name}`
        );
        continue;
      }

      try {
        // Create folder in database
        const [createdFolder] = await db
          .insert(emailFolders)
          .values({
            accountId,
            userId: user.id,
            name: folder.name,
            externalId: folder.id,
            type: folder.confirmedType, // Original type
            folderType: folder.confirmedType as any, // Standardized type
            displayName: folder.displayName,
            isSystemFolder: [
              'inbox',
              'sent',
              'drafts',
              'trash',
              'spam',
            ].includes(folder.confirmedType),
            messageCount: folder.messageCount,
            unreadCount: folder.unreadCount,
            syncEnabled: shouldSyncByDefault(
              folder.confirmedType as CoreFolderType
            ), // FIXED
            lastSyncedAt: new Date(),
          })
          .returning();

        createdFolders.push(createdFolder);

        // Create folder mapping (for future reference)
        const [mapping] = await db
          .insert(folderMappings)
          .values({
            userId: user.id,
            accountId,
            providerFolderName: folder.name,
            providerFolderId: folder.id,
            mappedToType: folder.confirmedType,
            mappingSource: folder.wasModified ? 'manual' : 'auto',
          })
          .returning();

        createdMappings.push(mapping);

        console.log(
          `[Folder Confirmation] Created folder: ${folder.name} → ${folder.confirmedType} (${folder.wasModified ? 'manual' : 'auto'})`
        );
      } catch (folderError) {
        console.error(
          `[Folder Confirmation] Error creating folder ${folder.name}:`,
          folderError
        );
        // Continue with other folders even if one fails
      }
    }

    // Mark account as setup complete
    await db
      .update(emailAccounts)
      .set({
        status: 'active',
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));

    console.log(
      `[Folder Confirmation] Successfully created ${createdFolders.length} folders and ${createdMappings.length} mappings`
    );

    return NextResponse.json({
      success: true,
      foldersCreated: createdFolders.length,
      mappingsCreated: createdMappings.length,
      summary: {
        total: folders.length,
        enabled: folders.filter((f) => f.enabled).length,
        disabled: folders.filter((f) => !f.enabled).length,
        manual: folders.filter((f) => f.wasModified).length,
        auto: folders.filter((f) => !f.wasModified).length,
      },
    });
  } catch (error) {
    console.error('[Folder Confirmation API] Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to confirm folders',
      },
      { status: 500 }
    );
  }
}
