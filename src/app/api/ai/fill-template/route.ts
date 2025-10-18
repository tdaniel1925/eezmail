import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { db } from '@/lib/db';
import { emailTemplates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fill email template with context-aware content
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
    const { templateId, context } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Fetch template from database
    const template = await db
      .select()
      .from(emailTemplates)
      .where(
        and(
          eq(emailTemplates.id, templateId),
          eq(emailTemplates.userId, user.id)
        )
      )
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const templateData = template[0];

    // Call OpenAI to fill template
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an email template filler. You fill email templates with context-aware content while preserving the template structure and tone.

The user will provide:
1. A template with variables like {name}, {date}, {topic}, {company}, etc.
2. Context information to fill those variables

Your task:
1. Identify all variables in the template
2. Fill them with appropriate values from the context
3. If context is missing for a variable, use a reasonable default or "[FILL]" placeholder
4. Maintain the tone and style of the template
5. Fix any grammar issues that arise from variable substitution

Return JSON:
{
  "subject": "Filled subject line",
  "body": "Filled email body",
  "filledVariables": {
    "variable_name": "filled_value"
  },
  "missingVariables": ["list of variables without values"]
}`,
        },
        {
          role: 'user',
          content: `Template Name: ${templateData.name}
Category: ${templateData.category}

Template Subject: ${templateData.subject}

Template Body:
${templateData.body}

Context provided:
${JSON.stringify(context, null, 2)}

Please fill the template with the provided context.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to fill template' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let filledTemplate: any;
    try {
      filledTemplate = JSON.parse(content);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse filled template' },
        { status: 500 }
      );
    }

    // Increment use count
    await db
      .update(emailTemplates)
      .set({
        useCount: (templateData.useCount || 0) + 1,
      })
      .where(eq(emailTemplates.id, templateId));

    return NextResponse.json({
      success: true,
      template: {
        name: templateData.name,
        category: templateData.category,
      },
      ...filledTemplate,
    });
  } catch (error) {
    console.error('Error in fill-template API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



