import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Summarize email attachment content
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { fileName, fileType, content, pageCount } = body;

    if (!fileName || !content) {
      return NextResponse.json(
        { error: 'File name and content are required' },
        { status: 400 }
      );
    }

    // Determine document type for specialized summarization
    const isInvoice =
      fileName.toLowerCase().includes('invoice') ||
      content.toLowerCase().includes('invoice') ||
      content.toLowerCase().includes('bill');

    const isContract =
      fileName.toLowerCase().includes('contract') ||
      fileName.toLowerCase().includes('agreement') ||
      content.toLowerCase().includes('agreement');

    let systemPrompt = `You are a document summarization assistant. Create concise, informative summaries of documents.

For general documents:
- Provide 2-3 sentence overview
- Extract key points
- Note important dates, numbers, or deadlines
- Identify document purpose

Return JSON:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["Important points"],
  "documentType": "Type of document",
  "structuredData": {} // Optional extracted data
}`;

    if (isInvoice) {
      systemPrompt = `You are an invoice analyzer. Extract key financial information.

Return JSON:
{
  "summary": "Brief invoice summary",
  "documentType": "Invoice",
  "structuredData": {
    "vendor": "Vendor name",
    "amount": "Total amount",
    "dueDate": "Due date",
    "invoiceNumber": "Invoice number",
    "items": ["List of items/services"]
  },
  "keyPoints": ["Important details"]
}`;
    } else if (isContract) {
      systemPrompt = `You are a contract analyzer. Extract key contract terms.

Return JSON:
{
  "summary": "Brief contract summary",
  "documentType": "Contract/Agreement",
  "structuredData": {
    "parties": ["Party names"],
    "effectiveDate": "Start date",
    "expirationDate": "End date",
    "value": "Contract value if mentioned",
    "keyTerms": ["Important terms"]
  },
  "keyPoints": ["Critical clauses or conditions"]
}`;
    }

    // Call OpenAI to summarize
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `File: ${fileName}
Type: ${fileType || 'unknown'}
${pageCount ? `Pages: ${pageCount}` : ''}

Content:
${content.substring(0, 4000)}${content.length > 4000 ? '\n\n[Content truncated...]' : ''}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseContent = response.choices[0]?.message?.content;

    if (!responseContent) {
      return NextResponse.json(
        { error: 'Failed to summarize attachment' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let summaryData: any;
    try {
      summaryData = JSON.parse(responseContent);
    } catch (parseError) {
      // Fallback to plain text summary
      summaryData = {
        summary: responseContent,
        documentType: fileType || 'Document',
        keyPoints: [],
      };
    }

    return NextResponse.json({
      success: true,
      fileName,
      fileType,
      pageCount,
      ...summaryData,
    });
  } catch (error) {
    console.error('Error in summarize-attachment API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

