'use server';

import { db } from '@/lib/db';
import { emails, contacts, calendarEvents, tasks } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Conversation Context Manager
 * Tracks conversation state for pronoun resolution and multi-turn conversations
 */

interface ConversationContext {
  userId: string;
  lastEmailId?: string;
  lastContactId?: string;
  lastEventId?: string;
  lastTaskId?: string;
  lastSearchResults?: {
    type: 'email' | 'contact' | 'event' | 'task';
    ids: string[];
    timestamp: Date;
  };
  currentView?: string; // inbox, contact, calendar, tasks
  pendingActions?: Array<{
    action: string;
    params: any;
    timestamp: Date;
  }>;
  pronounReferences: Map<string, { type: string; id: string }>; // "him" -> {type: "contact", id: "123"}
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    entities?: Array<{ type: string; id: string; name: string }>;
    timestamp: Date;
  }>;
}

// In-memory storage (in production, use Redis or database)
const contextStore = new Map<string, ConversationContext>();

/**
 * Get conversation context for a user
 */
export async function getConversationContext(
  userId: string
): Promise<ConversationContext> {
  if (!contextStore.has(userId)) {
    contextStore.set(userId, {
      userId,
      pronounReferences: new Map(),
      conversationHistory: [],
    });
  }
  return contextStore.get(userId)!;
}

/**
 * Update conversation context
 */
export async function updateContext(
  userId: string,
  updates: Partial<ConversationContext>
): Promise<void> {
  const current = await getConversationContext(userId);
  contextStore.set(userId, { ...current, ...updates });
  console.log(`📝 [Context] Updated for user ${userId}:`, updates);
}

/**
 * Add message to conversation history and extract entities
 */
export async function addToConversationHistory(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  entities?: Array<{ type: string; id: string; name: string }>
): Promise<void> {
  const context = await getConversationContext(userId);

  // Add to history (keep last 20 messages)
  context.conversationHistory.push({
    role,
    content,
    entities,
    timestamp: new Date(),
  });

  if (context.conversationHistory.length > 20) {
    context.conversationHistory.shift();
  }

  // Update pronoun references based on entities
  if (entities && entities.length > 0) {
    const lastEntity = entities[entities.length - 1];

    // Update pronoun references
    if (lastEntity.type === 'contact') {
      context.pronounReferences.set('him', lastEntity);
      context.pronounReferences.set('her', lastEntity);
      context.pronounReferences.set('them', lastEntity);
      context.lastContactId = lastEntity.id;
    } else if (lastEntity.type === 'email') {
      context.pronounReferences.set('it', lastEntity);
      context.pronounReferences.set('that', lastEntity);
      context.lastEmailId = lastEntity.id;
    } else if (lastEntity.type === 'event') {
      context.pronounReferences.set('it', lastEntity);
      context.pronounReferences.set('that meeting', lastEntity);
      context.lastEventId = lastEntity.id;
    } else if (lastEntity.type === 'task') {
      context.pronounReferences.set('it', lastEntity);
      context.pronounReferences.set('that task', lastEntity);
      context.lastTaskId = lastEntity.id;
    }
  }

  await updateContext(userId, context);
}

/**
 * Resolve a reference like "it", "him", "that email"
 */
export async function resolveReference(
  userId: string,
  reference: string
): Promise<{ type: string; id: string; name?: string } | null> {
  const context = await getConversationContext(userId);
  const lowerRef = reference.toLowerCase().trim();

  console.log(
    `🔍 [Context] Resolving reference: "${reference}" for user ${userId}`
  );

  // Direct pronoun resolution
  if (context.pronounReferences.has(lowerRef)) {
    const resolved = context.pronounReferences.get(lowerRef)!;
    console.log(
      `✅ [Context] Resolved "${reference}" to ${resolved.type} ${resolved.id}`
    );
    return resolved;
  }

  // Special cases
  if (lowerRef.includes('that email') || lowerRef === 'the email') {
    if (context.lastEmailId) {
      return { type: 'email', id: context.lastEmailId };
    }
  }

  if (lowerRef.includes('that meeting') || lowerRef === 'the meeting') {
    if (context.lastEventId) {
      return { type: 'event', id: context.lastEventId };
    }
  }

  if (lowerRef.includes('that task') || lowerRef === 'the task') {
    if (context.lastTaskId) {
      return { type: 'task', id: context.lastTaskId };
    }
  }

  // Check last search results
  if (
    (lowerRef === 'it' || lowerRef === 'those' || lowerRef === 'them') &&
    context.lastSearchResults
  ) {
    return {
      type: context.lastSearchResults.type,
      id: context.lastSearchResults.ids[0], // Return first result
    };
  }

  // Fallback to last entity mentioned
  if (lowerRef === 'it') {
    if (context.lastEmailId) return { type: 'email', id: context.lastEmailId };
    if (context.lastEventId) return { type: 'event', id: context.lastEventId };
    if (context.lastTaskId) return { type: 'task', id: context.lastTaskId };
  }

  if (lowerRef === 'him' || lowerRef === 'her' || lowerRef === 'them') {
    if (context.lastContactId) {
      return { type: 'contact', id: context.lastContactId };
    }
  }

  console.log(`❌ [Context] Could not resolve reference: "${reference}"`);
  return null;
}

/**
 * Store search results for later reference
 */
export async function storeSearchResults(
  userId: string,
  type: 'email' | 'contact' | 'event' | 'task',
  ids: string[]
): Promise<void> {
  await updateContext(userId, {
    lastSearchResults: {
      type,
      ids,
      timestamp: new Date(),
    },
  });

  console.log(`💾 [Context] Stored ${ids.length} ${type} search results`);
}

/**
 * Get entity details by ID
 */
export async function getEntityDetails(
  type: string,
  id: string
): Promise<{ id: string; name: string; type: string } | null> {
  try {
    switch (type) {
      case 'email':
        const email = await db.query.emails.findFirst({
          where: eq(emails.id, id),
        });
        return email
          ? { id, name: email.subject || 'Untitled', type: 'email' }
          : null;

      case 'contact':
        const contact = await db.query.contacts.findFirst({
          where: eq(contacts.id, id),
        });
        return contact
          ? { id, name: contact.displayName || 'Unknown', type: 'contact' }
          : null;

      case 'event':
        const event = await db.query.calendarEvents.findFirst({
          where: eq(calendarEvents.id, id),
        });
        return event
          ? { id, name: event.title || 'Untitled Event', type: 'event' }
          : null;

      case 'task':
        const task = await db.query.tasks.findFirst({
          where: eq(tasks.id, id),
        });
        return task
          ? { id, name: task.title || 'Untitled Task', type: 'task' }
          : null;

      default:
        return null;
    }
  } catch (error) {
    console.error(`Error getting entity details for ${type} ${id}:`, error);
    return null;
  }
}

/**
 * Clear conversation context (e.g., when user starts fresh conversation)
 */
export async function clearContext(userId: string): Promise<void> {
  contextStore.delete(userId);
  console.log(`🗑️ [Context] Cleared for user ${userId}`);
}
