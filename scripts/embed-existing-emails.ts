#!/usr/bin/env tsx
/**
 * Batch Embedding Script
 * 
 * Generates embeddings for existing emails in the database.
 * Run with: npx tsx scripts/embed-existing-emails.ts <userId>
 * 
 * This script processes emails in batches to avoid overwhelming the API.
 * Progress is saved after each batch, so it's safe to stop and restart.
 */

import { db } from '../src/lib/db';
import { emails } from '../src/db/schema';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { generateEmbedding, prepareEmailForEmbedding } from '../src/lib/rag/embeddings';

const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 1000; // 1 second
const DELAY_BETWEEN_REQUESTS = 100; // 100ms

interface Stats {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  startTime: number;
}

async function embedExistingEmails(userId?: string) {
  console.log('🚀 Starting email embedding process...\n');

  const stats: Stats = {
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    startTime: Date.now(),
  };

  try {
    // Count total emails
    const whereClause = userId 
      ? and(eq(emails.userId, userId), isNull(emails.embedding))
      : isNull(emails.embedding);

    const totalResult = await db
      .select({ count: emails.id })
      .from(emails)
      .where(whereClause);

    stats.total = totalResult.length;

    if (stats.total === 0) {
      console.log('✅ No emails need embedding. All done!');
      return;
    }

    console.log(`📊 Found ${stats.total} emails to process`);
    console.log(`📦 Batch size: ${BATCH_SIZE}`);
    console.log(`⏱️  Delay between batches: ${DELAY_BETWEEN_BATCHES}ms\n`);

    // Process in batches
    let hasMore = true;
    let batchNumber = 0;

    while (hasMore) {
      batchNumber++;
      
      // Fetch batch
      const batch = await db
        .select({
          id: emails.id,
          subject: emails.subject,
          bodyText: emails.bodyText,
          bodyHtml: emails.bodyHtml,
        })
        .from(emails)
        .where(whereClause)
        .limit(BATCH_SIZE);

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`\n📦 Processing batch ${batchNumber} (${batch.length} emails)...`);

      // Process each email in the batch
      for (const email of batch) {
        stats.processed++;

        try {
          // Prepare text
          const text = prepareEmailForEmbedding(email);
          
          if (!text || text.trim().length === 0) {
            stats.skipped++;
            console.log(`  ⏩ Skipped ${email.id} (empty content)`);
            continue;
          }

          // Generate embedding
          const embedding = await generateEmbedding(text);

          // Save to database
          await db
            .update(emails)
            .set({ embedding: JSON.stringify(embedding) as any })
            .where(eq(emails.id, email.id));

          stats.succeeded++;
          
          // Show progress
          const progress = ((stats.processed / stats.total) * 100).toFixed(1);
          process.stdout.write(`  ✅ ${progress}% (${stats.succeeded}/${stats.total})\r`);

          // Rate limiting
          await sleep(DELAY_BETWEEN_REQUESTS);

        } catch (error) {
          stats.failed++;
          console.log(`  ❌ Failed ${email.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Delay between batches
      if (hasMore) {
        console.log(`\n  ⏸️  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    // Final statistics
    const duration = Date.now() - stats.startTime;
    const durationMin = (duration / 1000 / 60).toFixed(2);

    console.log('\n\n' + '='.repeat(50));
    console.log('📊 EMBEDDING COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Succeeded: ${stats.succeeded}`);
    console.log(`❌ Failed:    ${stats.failed}`);
    console.log(`⏩ Skipped:   ${stats.skipped}`);
    console.log(`📊 Total:     ${stats.total}`);
    console.log(`⏱️  Duration:  ${durationMin} minutes`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run script
const userId = process.argv[2];

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

console.log('=' + '='.repeat(50));
console.log('  EMAIL EMBEDDING BATCH PROCESSOR');
console.log('='.repeat(50) + '\n');

if (userId) {
  console.log(`👤 Processing emails for user: ${userId}\n`);
}

embedExistingEmails(userId);

