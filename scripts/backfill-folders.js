/**
 * Backfill Existing Folders Script
 *
 * This script updates existing email folders to populate the new standardized fields
 * (folderType, isSystemFolder, displayName, icon, etc.) based on their current names.
 *
 * Safe to run multiple times - it only updates folders that need updating.
 *
 * Usage: node scripts/backfill-folders.js
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { emailFolders } from '../src/db/schema.ts';
import { eq, sql } from 'drizzle-orm';
import {
  detectFolderType,
  isSystemFolder,
  getDefaultIcon,
  getDefaultSortOrder,
  getDefaultSyncFrequency,
  getDefaultSyncDaysBack,
  shouldSyncByDefault,
} from '../src/lib/folders/folder-mapper.ts';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function backfillFolders() {
  console.log('🚀 Starting folder backfill...\n');

  try {
    // Fetch all folders that need backfilling
    const allFolders = await db
      .select()
      .from(emailFolders)
      .where(
        sql`${emailFolders.folderType} = 'custom' OR ${emailFolders.folderType} IS NULL`
      );

    console.log(`📊 Found ${allFolders.length} folders to backfill\n`);

    if (allFolders.length === 0) {
      console.log('✅ No folders need backfilling. All done!');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const folder of allFolders) {
      try {
        // Detect folder type from name
        const folderType = detectFolderType(folder.name);
        const isSystem = isSystemFolder(folderType);

        // Only update if detection found a non-custom type
        if (folderType === 'custom') {
          console.log(`⏭️  Skipping: ${folder.name} (remains custom)`);
          skippedCount++;
          continue;
        }

        // Update folder with new standardized fields
        await db
          .update(emailFolders)
          .set({
            folderType,
            isSystemFolder: isSystem,
            displayName: folder.displayName || folder.name,
            icon: getDefaultIcon(folderType),
            sortOrder: getDefaultSortOrder(folderType),
            syncEnabled:
              folder.syncEnabled !== undefined
                ? folder.syncEnabled
                : shouldSyncByDefault(folderType),
            syncFrequencyMinutes:
              folder.syncFrequencyMinutes ||
              getDefaultSyncFrequency(folderType),
            syncDaysBack:
              folder.syncDaysBack || getDefaultSyncDaysBack(folderType),
            updatedAt: new Date(),
          })
          .where(eq(emailFolders.id, folder.id));

        console.log(
          `✅ Updated: ${folder.name} → ${folderType} (${isSystem ? 'system' : 'custom'})`
        );
        updatedCount++;
      } catch (error) {
        console.error(
          `❌ Failed to update folder ${folder.name}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log(`\n📊 Backfill Summary:`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(
      `   ❌ Failed: ${allFolders.length - updatedCount - skippedCount}`
    );

    console.log('\n🎉 Folder backfill complete!');
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the backfill
backfillFolders()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });




