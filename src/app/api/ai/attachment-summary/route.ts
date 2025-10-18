import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attachmentId, filename, contentType } = await request.json();

    if (!attachmentId || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate AI summary based on file metadata
    // In a production environment, you would extract content from the file
    // For now, we'll generate a summary based on filename and type

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that helps users understand their email attachments. 
                   Generate a helpful, concise summary of what this attachment likely contains based on its filename and type.
                   Keep the summary to 2-3 sentences. Be professional and informative.`,
        },
        {
          role: 'user',
          content: `File: ${filename}\nType: ${contentType}\n\nGenerate a summary of what this attachment likely contains.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const summary =
      completion.choices[0]?.message?.content || 'Unable to generate summary';

    return NextResponse.json({
      success: true,
      summary,
      attachmentId,
    });
  } catch (error) {
    console.error('Error generating attachment summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
