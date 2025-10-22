/**
 * Email Template Engine
 * Provides template expansion with variable substitution
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface EmailTemplate {
  id: string;
  name: string;
  shortcut: string; // e.g., "/meeting"
  content: string;
  variables: string[]; // e.g., ["name", "date", "topic"]
  category?: string;
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateExpansionResult {
  content: string;
  missingVariables: string[];
}

/**
 * Default templates available to all users
 */
export const DEFAULT_TEMPLATES: Omit<
  EmailTemplate,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>[] = [
  {
    name: 'Meeting Request',
    shortcut: '/meeting',
    content: `Hi {name},

I'd like to schedule a meeting to discuss {topic}. 

Would {date} at {time} work for you? The meeting should take about {duration}.

Let me know if that works or suggest an alternative time.

Best regards`,
    variables: ['name', 'topic', 'date', 'time', 'duration'],
    category: 'scheduling',
    isPublic: true,
  },
  {
    name: 'Follow Up',
    shortcut: '/followup',
    content: `Hi {name},

Just following up on {topic} from {date}.

{question}

Looking forward to hearing from you.

Best regards`,
    variables: ['name', 'topic', 'date', 'question'],
    category: 'follow-up',
    isPublic: true,
  },
  {
    name: 'Thank You',
    shortcut: '/thanks',
    content: `Hi {name},

Thank you for {reason}. I really appreciate {what}.

{additional}

Best regards`,
    variables: ['name', 'reason', 'what', 'additional'],
    category: 'gratitude',
    isPublic: true,
  },
  {
    name: 'Out of Office',
    shortcut: '/ooo',
    content: `Thank you for your email.

I'm currently out of office from {start_date} to {end_date} with limited access to email.

For urgent matters, please contact {backup_contact} at {backup_email}.

I'll respond to your message when I return.

Best regards`,
    variables: ['start_date', 'end_date', 'backup_contact', 'backup_email'],
    category: 'auto-reply',
    isPublic: true,
  },
  {
    name: 'Introduction',
    shortcut: '/intro',
    content: `Hi {recipient},

I'd like to introduce you to {person_name}, {person_title} at {person_company}.

{introduction_context}

I think you both would benefit from connecting about {topic}.

{person_name}, meet {recipient}.

Best regards`,
    variables: [
      'recipient',
      'person_name',
      'person_title',
      'person_company',
      'introduction_context',
      'topic',
    ],
    category: 'introduction',
    isPublic: true,
  },
  {
    name: 'Status Update',
    shortcut: '/status',
    content: `Hi {name},

Quick update on {project}:

✅ Completed: {completed}
🔄 In Progress: {in_progress}
📋 Next Steps: {next_steps}

{additional_notes}

Let me know if you have any questions.

Best regards`,
    variables: [
      'name',
      'project',
      'completed',
      'in_progress',
      'next_steps',
      'additional_notes',
    ],
    category: 'project',
    isPublic: true,
  },
  {
    name: 'Decline Politely',
    shortcut: '/decline',
    content: `Hi {name},

Thank you for thinking of me for {opportunity}.

Unfortunately, I won't be able to {action} due to {reason}.

{alternative_suggestion}

I appreciate your understanding.

Best regards`,
    variables: [
      'name',
      'opportunity',
      'action',
      'reason',
      'alternative_suggestion',
    ],
    category: 'decline',
    isPublic: true,
  },
];

/**
 * Expand a template with provided context
 */
export async function expandTemplate(
  template: EmailTemplate | (typeof DEFAULT_TEMPLATES)[0],
  context: Record<string, string>
): Promise<TemplateExpansionResult> {
  let content = template.content;
  const missingVariables: string[] = [];

  // Replace all variables
  template.variables.forEach((variable) => {
    const value = context[variable];
    if (value !== undefined && value !== null) {
      // Replace all occurrences of {variable}
      content = content.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
    } else {
      missingVariables.push(variable);
    }
  });

  return {
    content,
    missingVariables,
  };
}

/**
 * Get available templates for a user (default + custom)
 */
export async function getAvailableTemplates(
  userId: string
): Promise<EmailTemplate[]> {
  // TODO: Fetch user's custom templates from database
  // For now, return default templates

  const templates: EmailTemplate[] = DEFAULT_TEMPLATES.map(
    (template, index) => ({
      ...template,
      id: `default-${index}`,
      userId: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  return templates;
}

/**
 * Search templates by shortcut or name
 */
export async function searchTemplates(
  query: string,
  userId: string
): Promise<EmailTemplate[]> {
  const templates = await getAvailableTemplates(userId);
  const lowerQuery = query.toLowerCase();

  return templates.filter(
    (template) =>
      template.shortcut.toLowerCase().includes(lowerQuery) ||
      template.name.toLowerCase().includes(lowerQuery) ||
      template.category?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get template by shortcut
 */
export async function getTemplateByShortcut(
  shortcut: string,
  userId: string
): Promise<EmailTemplate | null> {
  const templates = await getAvailableTemplates(userId);
  return templates.find((t) => t.shortcut === shortcut) || null;
}

/**
 * Auto-fill template variables using AI and context
 */
export async function autoFillTemplate(
  template: EmailTemplate,
  emailContext?: {
    recipientName?: string;
    recipientEmail?: string;
    threadSubject?: string;
    previousMessages?: string;
  }
): Promise<Record<string, string>> {
  const context: Record<string, string> = {};

  // Auto-fill common variables from context
  if (emailContext?.recipientName) {
    context.name = emailContext.recipientName;
    context.recipient = emailContext.recipientName;
  }

  if (emailContext?.threadSubject) {
    context.topic = emailContext.threadSubject;
    context.subject = emailContext.threadSubject;
  }

  // TODO: Use AI to extract more context from previous messages
  // For now, return basic context
  return context;
}

/**
 * Create custom template for user
 */
export async function createCustomTemplate(
  userId: string,
  template: Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<EmailTemplate> {
  // TODO: Store in database
  // For now, return template with generated ID

  const newTemplate: EmailTemplate = {
    ...template,
    id: `custom-${Date.now()}`,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log(
    `✅ Created custom template: ${newTemplate.name} (${newTemplate.shortcut})`
  );

  return newTemplate;
}

/**
 * Parse template content to extract variables
 */
export function extractVariablesFromContent(content: string): string[] {
  const matches = content.match(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g);
  if (!matches) return [];

  const variables = matches.map((match) => match.slice(1, -1)); // Remove { }
  return Array.from(new Set(variables)); // Deduplicate
}

/**
 * Validate template content
 */
export function validateTemplate(template: Partial<EmailTemplate>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required');
  }

  if (!template.shortcut || !template.shortcut.startsWith('/')) {
    errors.push('Shortcut must start with /');
  }

  if (!template.content || template.content.trim().length === 0) {
    errors.push('Template content is required');
  }

  if (template.content) {
    const extractedVars = extractVariablesFromContent(template.content);
    if (extractedVars.length === 0) {
      errors.push(
        'Template should contain at least one variable (e.g., {name})'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
