'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailTemplates, type EmailTemplateCategory } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface Template {
  id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  category: EmailTemplateCategory | null;
  variables: string[];
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new email template
 */
export async function createTemplate(params: {
  name: string;
  subject: string;
  body: string;
  category?: EmailTemplateCategory;
  variables?: string[];
}): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const [template] = await db
      .insert(emailTemplates)
      .values({
        userId: user.id,
        name: params.name,
        subject: params.subject,
        body: params.body,
        category: params.category || 'other',
        variables: params.variables || [],
      })
      .returning();

    return { success: true, templateId: template.id };
  } catch (error) {
    console.error('Error creating template:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create template',
    };
  }
}

/**
 * Get all templates for the current user
 */
export async function getUserTemplates(params?: {
  category?: EmailTemplateCategory;
}): Promise<{ success: boolean; templates?: Template[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const conditions = [eq(emailTemplates.userId, user.id)];

    if (params?.category) {
      conditions.push(eq(emailTemplates.category, params.category));
    }

    const templates = await db.query.emailTemplates.findMany({
      where: and(...conditions),
      orderBy: [desc(emailTemplates.updatedAt)],
    });

    return { success: true, templates };
  } catch (error) {
    console.error('Error getting templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get templates',
    };
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(templateId: string): Promise<{
  success: boolean;
  template?: Template;
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

    return { success: true, template };
  } catch (error) {
    console.error('Error getting template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get template',
    };
  }
}

/**
 * Use a template (increments use count)
 */
export async function useTemplate(templateId: string): Promise<{
  success: boolean;
  template?: Template;
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

    // Get template first
    const template = await db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.userId, user.id)
      ),
    });

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Increment use count
    await db
      .update(emailTemplates)
      .set({
        useCount: template.useCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, templateId));

    return {
      success: true,
      template: { ...template, useCount: template.useCount + 1 },
    };
  } catch (error) {
    console.error('Error using template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to use template',
    };
  }
}

/**
 * Update an existing template
 */
export async function updateTemplate(
  templateId: string,
  updates: {
    name?: string;
    subject?: string;
    body?: string;
    category?: EmailTemplateCategory;
    variables?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const template = await db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.userId, user.id)
      ),
    });

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    await db
      .update(emailTemplates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, templateId));

    return { success: true };
  } catch (error) {
    console.error('Error updating template:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update template',
    };
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<{
  success: boolean;
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

    // Verify ownership
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

    return { success: true };
  } catch (error) {
    console.error('Error deleting template:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete template',
    };
  }
}
