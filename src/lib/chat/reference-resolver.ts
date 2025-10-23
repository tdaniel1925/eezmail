'use server';

import { resolveReference, getEntityDetails } from './context-manager';

/**
 * Reference Resolution Service
 * Handles natural language references and converts them to concrete entities
 */

interface ResolvedReference {
  originalText: string;
  resolvedType: string;
  resolvedId: string;
  resolvedName?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Parse message and resolve all references
 */
export async function parseAndResolveReferences(
  userId: string,
  message: string
): Promise<{
  resolvedMessage: string;
  references: ResolvedReference[];
  needsClarification: boolean;
  clarificationPrompt?: string;
}> {
  const references: ResolvedReference[] = [];
  let resolvedMessage = message;
  let needsClarification = false;
  let clarificationPrompt: string | undefined;

  console.log(`🔍 [Reference Resolver] Parsing: "${message}"`);

  // Common pronouns and references to check
  const pronounPatterns = [
    { pattern: /\b(it|this)\b/gi, type: 'neutral' },
    { pattern: /\b(him|his)\b/gi, type: 'male' },
    { pattern: /\b(her|hers)\b/gi, type: 'female' },
    { pattern: /\b(them|their|theirs|those)\b/gi, type: 'plural' },
    { pattern: /\b(that email|the email)\b/gi, type: 'email' },
    { pattern: /\b(that meeting|the meeting)\b/gi, type: 'event' },
    { pattern: /\b(that task|the task)\b/gi, type: 'task' },
    { pattern: /\b(that contact|the contact)\b/gi, type: 'contact' },
  ];

  for (const { pattern, type } of pronounPatterns) {
    const matches = message.match(pattern);
    if (matches) {
      for (const match of matches) {
        const resolved = await resolveReference(userId, match);
        
        if (resolved) {
          const details = await getEntityDetails(resolved.type, resolved.id);
          
          if (details) {
            references.push({
              originalText: match,
              resolvedType: resolved.type,
              resolvedId: resolved.id,
              resolvedName: details.name,
              confidence: 'high',
            });

            // Replace pronoun with concrete reference in message
            resolvedMessage = resolvedMessage.replace(
              new RegExp(`\\b${match}\\b`, 'i'),
              `"${details.name}"`
            );

            console.log(`✅ [Reference Resolver] "${match}" → ${details.name} (${resolved.type})`);
          }
        } else {
          // Could not resolve - may need clarification
          needsClarification = true;
          clarificationPrompt = `I'm not sure what you're referring to with "${match}". Could you be more specific?`;
          console.log(`❓ [Reference Resolver] Could not resolve "${match}"`);
        }
      }
    }
  }

  return {
    resolvedMessage,
    references,
    needsClarification,
    clarificationPrompt,
  };
}

/**
 * Check if message contains references that need resolution
 */
export function containsReferences(message: string): boolean {
  const referencePatterns = [
    /\b(it|this|that)\b/i,
    /\b(him|her|them|his|hers|their)\b/i,
    /\b(that email|the email|this email)\b/i,
    /\b(that meeting|the meeting|this meeting)\b/i,
    /\b(that task|the task|this task)\b/i,
  ];

  return referencePatterns.some(pattern => pattern.test(message));
}

/**
 * Suggest concrete rephrasing of ambiguous references
 */
export async function suggestClarification(
  userId: string,
  message: string
): Promise<string[]> {
  const suggestions: string[] = [];

  if (message.toLowerCase().includes('it') || message.toLowerCase().includes('this')) {
    suggestions.push('Did you mean the last email I found?');
    suggestions.push('Are you referring to the recent meeting?');
    suggestions.push('Do you mean the task we just discussed?');
  }

  if (message.toLowerCase().includes('him') || message.toLowerCase().includes('her')) {
    suggestions.push('Which contact are you referring to?');
    suggestions.push('Could you specify the person\'s name?');
  }

  if (message.toLowerCase().includes('them') || message.toLowerCase().includes('those')) {
    suggestions.push('Are you referring to the search results?');
    suggestions.push('Do you mean all the emails I found?');
  }

  return suggestions;
}

/**
 * Extract action and target from resolved message
 */
export interface ParsedCommand {
  action: string;
  target?: {
    type: string;
    id: string;
    name: string;
  };
  parameters: Record<string, any>;
}

export async function parseCommand(
  userId: string,
  message: string
): Promise<ParsedCommand | null> {
  // First resolve references
  const { resolvedMessage, references } = await parseAndResolveReferences(userId, message);

  const lower = resolvedMessage.toLowerCase();

  // Email actions
  if (lower.includes('move') && references.some(r => r.resolvedType === 'email')) {
    const emailRef = references.find(r => r.resolvedType === 'email');
    // Extract folder name
    const folderMatch = lower.match(/to\s+([a-z]+)/);
    return {
      action: 'move_emails',
      target: emailRef ? {
        type: emailRef.resolvedType,
        id: emailRef.resolvedId,
        name: emailRef.resolvedName || '',
      } : undefined,
      parameters: {
        folder: folderMatch ? folderMatch[1] : 'archive',
      },
    };
  }

  if (lower.includes('delete') && references.some(r => r.resolvedType === 'email')) {
    const emailRef = references.find(r => r.resolvedType === 'email');
    return {
      action: 'delete_emails',
      target: emailRef ? {
        type: emailRef.resolvedType,
        id: emailRef.resolvedId,
        name: emailRef.resolvedName || '',
      } : undefined,
      parameters: {},
    };
  }

  if (lower.includes('email') && references.some(r => r.resolvedType === 'contact')) {
    const contactRef = references.find(r => r.resolvedType === 'contact');
    return {
      action: 'send_email',
      target: contactRef ? {
        type: contactRef.resolvedType,
        id: contactRef.resolvedId,
        name: contactRef.resolvedName || '',
      } : undefined,
      parameters: {
        recipient: contactRef?.resolvedName,
      },
    };
  }

  return null;
}

