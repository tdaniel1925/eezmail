/**
 * Attachment Indexer
 * Extracts text from PDF, DOCX, and other documents for RAG
 */

'use server';

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { generateEmbedding } from '@/lib/rag/embeddings';
import { db } from '@/lib/db';

export interface AttachmentContent {
  attachmentId: string;
  emailId: string;
  filename: string;
  contentType: string;
  extractedText: string;
  textLength: number;
  extractionMethod: 'pdf' | 'docx' | 'text' | 'fallback';
  embedding?: number[];
  extractedAt: Date;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    author?: string;
    title?: string;
  };
}

/**
 * Extract text from attachment buffer
 */
export async function extractAttachmentText(
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<{ text: string; method: string; metadata?: Record<string, any> }> {
  try {
    // PDF extraction
    if (
      contentType === 'application/pdf' ||
      filename.toLowerCase().endsWith('.pdf')
    ) {
      return await extractPDFText(buffer);
    }

    // DOCX extraction
    if (
      contentType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filename.toLowerCase().endsWith('.docx')
    ) {
      return await extractDOCXText(buffer);
    }

    // Plain text extraction
    if (
      contentType.startsWith('text/') ||
      filename.toLowerCase().endsWith('.txt')
    ) {
      return extractPlainText(buffer);
    }

    // HTML extraction
    if (
      contentType === 'text/html' ||
      filename.toLowerCase().endsWith('.html')
    ) {
      return extractHTMLText(buffer);
    }

    // Unsupported format
    return {
      text: '',
      method: 'unsupported',
      metadata: { contentType, filename },
    };
  } catch (error) {
    console.error(`Failed to extract text from ${filename}:`, error);
    return {
      text: '',
      method: 'error',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Extract text from PDF
 */
async function extractPDFText(
  buffer: Buffer
): Promise<{ text: string; method: string; metadata: Record<string, any> }> {
  try {
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      method: 'pdf',
      metadata: {
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        info: data.info,
        version: data.version,
      },
    };
  } catch (error) {
    throw new Error(
      `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }
}

/**
 * Extract text from DOCX
 */
async function extractDOCXText(
  buffer: Buffer
): Promise<{ text: string; method: string; metadata: Record<string, any> }> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value,
      method: 'docx',
      metadata: {
        wordCount: result.value.split(/\s+/).length,
        messages: result.messages, // Warnings/errors from mammoth
      },
    };
  } catch (error) {
    throw new Error(
      `DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }
}

/**
 * Extract plain text
 */
function extractPlainText(buffer: Buffer): { text: string; method: string } {
  return {
    text: buffer.toString('utf-8'),
    method: 'text',
  };
}

/**
 * Extract text from HTML (strip tags)
 */
function extractHTMLText(buffer: Buffer): { text: string; method: string } {
  const html = buffer.toString('utf-8');
  // Simple HTML tag stripping (use a proper HTML parser in production)
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    text,
    method: 'html',
  };
}

/**
 * Index attachment content (extract + generate embedding)
 */
export async function indexAttachment(
  attachmentId: string,
  emailId: string,
  filename: string,
  contentType: string,
  buffer: Buffer
): Promise<AttachmentContent> {
  // Extract text
  const extraction = await extractAttachmentText(buffer, contentType, filename);

  // Skip if no text extracted
  if (!extraction.text || extraction.text.length < 10) {
    throw new Error('No meaningful text extracted from attachment');
  }

  // Generate embedding for text
  let embedding: number[] | undefined;
  try {
    // Limit text length for embedding (OpenAI has token limits)
    const textForEmbedding = extraction.text.slice(0, 8000); // ~2000 tokens
    embedding = await generateEmbedding(textForEmbedding);
  } catch (error) {
    console.error('Failed to generate embedding for attachment:', error);
    // Continue without embedding
  }

  const content: AttachmentContent = {
    attachmentId,
    emailId,
    filename,
    contentType,
    extractedText: extraction.text,
    textLength: extraction.text.length,
    extractionMethod: extraction.method as any,
    embedding,
    extractedAt: new Date(),
    metadata: extraction.metadata,
  };

  // Save to database
  await saveAttachmentContent(content);

  return content;
}

/**
 * Search attachments by semantic similarity
 */
export async function searchAttachments(
  userId: string,
  query: string,
  limit: number = 10
): Promise<
  Array<{
    attachmentId: string;
    emailId: string;
    filename: string;
    score: number;
    excerpt: string;
  }>
> {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Query database for similar attachments using vector similarity
  // This is a placeholder - implement actual vector search

  // For now, return empty array
  return [];
}

/**
 * Get attachment content by ID
 */
export async function getAttachmentContent(
  attachmentId: string
): Promise<AttachmentContent | null> {
  // Query database
  // This is a placeholder
  return null;
}

/**
 * Save attachment content to database
 */
async function saveAttachmentContent(
  content: AttachmentContent
): Promise<void> {
  // Save to database
  // You would:
  // 1. Insert into attachment_content table
  // 2. Store embedding in vector column
  // 3. Create full-text search index on extractedText

  console.log(
    `Saved attachment content for ${content.filename} (${content.textLength} chars)`
  );
}

/**
 * Batch index attachments for an email
 */
export async function indexEmailAttachments(
  emailId: string,
  attachments: Array<{
    id: string;
    filename: string;
    contentType: string;
    storageUrl: string;
  }>
): Promise<AttachmentContent[]> {
  const results: AttachmentContent[] = [];

  for (const attachment of attachments) {
    try {
      // Check if supported format
      if (!isSupportedFormat(attachment.contentType, attachment.filename)) {
        console.log(`Skipping unsupported format: ${attachment.filename}`);
        continue;
      }

      // Download attachment from storage
      // In production, you'd fetch from Supabase Storage
      // const buffer = await fetchAttachmentBuffer(attachment.storageUrl);

      // For now, skip actual processing
      console.log(`Would index attachment: ${attachment.filename}`);

      // const content = await indexAttachment(
      //   attachment.id,
      //   emailId,
      //   attachment.filename,
      //   attachment.contentType,
      //   buffer
      // );

      // results.push(content);
    } catch (error) {
      console.error(
        `Failed to index attachment ${attachment.filename}:`,
        error
      );
    }
  }

  return results;
}

/**
 * Check if file format is supported for text extraction
 */
function isSupportedFormat(contentType: string, filename: string): boolean {
  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/html',
    'text/markdown',
  ];

  const supportedExtensions = ['.pdf', '.docx', '.txt', '.html', '.htm', '.md'];

  return (
    supportedTypes.includes(contentType) ||
    supportedExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
  );
}

/**
 * Get text excerpt from content
 */
export function getExcerpt(
  text: string,
  query: string,
  maxLength: number = 200
): string {
  // Find query position in text
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    // Query not found, return beginning
    return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  // Return text around query
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + maxLength - 50);

  let excerpt = text.slice(start, end);

  if (start > 0) excerpt = '...' + excerpt;
  if (end < text.length) excerpt = excerpt + '...';

  return excerpt;
}
