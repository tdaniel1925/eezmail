/**
 * Cron Job: Generate Embeddings for Emails
 * Runs every 10 minutes to generate embeddings for emails that don't have them
 *
 * Schedule: Every 10 minutes
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { sql, isNull, and, gte } from 'drizzle-orm';
import {
  generateEmbeddingsBatch,
  prepareEmailForEmbedding,
} from '@/lib/rag/embeddings';

const BATCH_SIZE = 100; // Process 100 emails per run
const MAX_AGE_HOURS = 720; // Only process emails from last 30 days

export async function GET(request: Request) {
  try {
    // Verify cron secret (protect endpoint)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting embedding generation cron job...');

    // Find emails without embeddings
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - MAX_AGE_HOURS);

    const emailsWithoutEmbeddings = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        bodyText: emails.bodyText,
        bodyHtml: emails.bodyHtml,
      })
      .from(emails)
      .where(
        and(
          isNull(emails.embedding),
          gte(emails.receivedAt, cutoffDate) // Only recent emails
        )
      )
      .limit(BATCH_SIZE);

    if (emailsWithoutEmbeddings.length === 0) {
      console.log('✅ No emails need embeddings');
      return NextResponse.json({
        success: true,
        message: 'No emails need embeddings',
        processed: 0,
      });
    }

    console.log(
      `📧 Found ${emailsWithoutEmbeddings.length} emails without embeddings`
    );

    // Prepare email texts for embedding
    const emailTexts = emailsWithoutEmbeddings.map((email) =>
      prepareEmailForEmbedding({
        subject: email.subject,
        bodyText: email.bodyText,
        bodyHtml: email.bodyHtml,
      })
    );

    // Generate embeddings in batch
    const embeddings = await generateEmbeddingsBatch(emailTexts);

    // Update emails with embeddings
    let updated = 0;
    for (let i = 0; i < emailsWithoutEmbeddings.length; i++) {
      const email = emailsWithoutEmbeddings[i];
      const embedding = embeddings[i];

      if (embedding) {
        await db.execute(
          sql`UPDATE emails 
              SET embedding = ${JSON.stringify(embedding)}::vector
              WHERE id = ${email.id}`
        );
        updated++;
      }
    }

    console.log(`✅ Generated embeddings for ${updated} emails`);

    return NextResponse.json({
      success: true,
      message: `Generated embeddings for ${updated} emails`,
      processed: updated,
      remaining: emailsWithoutEmbeddings.length - updated,
    });
  } catch (error) {
    console.error('❌ Embedding generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
