'use server';

import { db } from '@/lib/db';
import {
  emailTemplates,
  type EmailTemplateCategory,
  type NewEmailTemplate,
} from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Create a new email template
 */
export async function createEmailTemplate(
  userId: string,
  name: string,
  content: string,
  subject?: string,
  variables?: string[],
  category?: EmailTemplateCategory
): Promise<{
  success: boolean;
  template?: { id: string; name: string };
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const templateData: Partial<NewEmailTemplate> & {
      userId: string;
      name: string;
      body: string;
      subject: string;
    } = {
      userId,
      name,
      body: content,
      subject: subject || 'No Subject',
      ...(variables && variables.length > 0 ? { variables } : {}),
      ...(category ? { category } : {}),
    };

    const [newTemplate] = await db
      .insert(emailTemplates)
      .values(templateData)
      .returning({ id: emailTemplates.id, name: emailTemplates.name });

    return { success: true, template: newTemplate };
  } catch (error) {
    console.error('Error creating email template:', error);
    return { success: false, error: 'Failed to create template' };
  }
}

/**
 * List all templates for a user
 */
export async function listEmailTemplates(userId: string): Promise<{
  success: boolean;
  templates?: Array<{
    id: string;
    name: string;
    subject: string | null;
    category: string | null;
    usageCount: number;
    createdAt: Date;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const templates = await db
      .select({
        id: emailTemplates.id,
        name: emailTemplates.name,
        subject: emailTemplates.subject,
        category: emailTemplates.category,
        usageCount: emailTemplates.useCount,
        createdAt: emailTemplates.createdAt,
      })
      .from(emailTemplates)
      .where(eq(emailTemplates.userId, userId))
      .orderBy(desc(emailTemplates.useCount), desc(emailTemplates.createdAt));

    return { success: true, templates };
  } catch (error) {
    console.error('Error listing email templates:', error);
    return { success: false, error: 'Failed to list templates' };
  }
}

/**
 * Get a specific template
 */
export async function getEmailTemplate(templateId: string): Promise<{
  success: boolean;
  template?: {
    id: string;
    name: string;
    subject: string | null;
    content: string;
    variables: string[] | null;
    category: string | null;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const template = await db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.userId, user.id)
      ),
    });

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    return {
      success: true,
      template: {
        id: template.id,
        name: template.name,
        subject: template.subject,
        content: template.body,
        variables: template.variables as string[] | null,
        category: template.category as string | null,
      },
    };
  } catch (error) {
    console.error('Error getting email template:', error);
    return { success: false, error: 'Failed to get template' };
  }
}

/**
 * Use a template and fill in variables
 */
export async function useTemplate(
  templateId: string,
  variables?: Record<string, string>
): Promise<{
  success: boolean;
  content?: { subject: string; body: string };
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const template = await db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.userId, user.id)
      ),
    });

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Fill in variables
    let subject = template.subject || '';
    let body = template.body;

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        body = body.replace(new RegExp(placeholder, 'g'), value);
      });
    }

    // Increment usage count
    await db.execute(
      sql`UPDATE email_templates SET use_count = use_count + 1 WHERE id = ${templateId}`
    );

    return { success: true, content: { subject, body } };
  } catch (error) {
    console.error('Error using template:', error);
    return { success: false, error: 'Failed to use template' };
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const template = await db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.userId, user.id)
      ),
    });

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    await db.delete(emailTemplates).where(eq(emailTemplates.id, templateId));

    return { success: true, message: 'Template deleted successfully' };
  } catch (error) {
    console.error('Error deleting template:', error);
    return { success: false, error: 'Failed to delete template' };
  }
}

/**
 * Suggest a template based on context
 */
export async function suggestTemplateFor(
  userId: string,
  emailContext: string
): Promise<{
  success: boolean;
  templates?: Array<{
    id: string;
    name: string;
    category: string | null;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Simple keyword matching for suggestions
    const contextLower = emailContext.toLowerCase();
    let suggestedCategory: 'meeting' | 'followup' | 'intro' | 'other' = 'other';

    if (
      contextLower.includes('meeting') ||
      contextLower.includes('schedule') ||
      contextLower.includes('call')
    ) {
      suggestedCategory = 'meeting';
    } else if (
      contextLower.includes('follow up') ||
      contextLower.includes('following up')
    ) {
      suggestedCategory = 'followup';
    } else if (
      contextLower.includes('introduction') ||
      contextLower.includes('introduce')
    ) {
      suggestedCategory = 'intro';
    }

    const whereConditions =
      suggestedCategory !== 'other'
        ? and(
            eq(emailTemplates.userId, userId),
            eq(emailTemplates.category, suggestedCategory)
          )
        : eq(emailTemplates.userId, userId);

    const templates = await db
      .select({
        id: emailTemplates.id,
        name: emailTemplates.name,
        category: emailTemplates.category,
      })
      .from(emailTemplates)
      .where(whereConditions)
      .orderBy(desc(emailTemplates.useCount))
      .limit(5);

    return { success: true, templates };
  } catch (error) {
    console.error('Error suggesting templates:', error);
    return { success: false, error: 'Failed to suggest templates' };
  }
}
