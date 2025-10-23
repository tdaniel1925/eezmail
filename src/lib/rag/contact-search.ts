'use server';

import { db } from '@/lib/db';
import { contacts, contactEmails, contactPhones, contactTimeline } from '@/db/schema';
import { eq, or, ilike, desc, and, sql } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Semantic search over contacts using embeddings and text similarity
 */
export async function searchContactsSemanticRAG(
  query: string,
  userId: string,
  limit: number = 5
): Promise<{
  contacts: any[];
  summary: string;
  totalFound: number;
}> {
  try {
    // Generate embedding for query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // First, do a broad text search to get candidates
    const searchTerms = query.toLowerCase().split(' ');
    
    const candidateContacts = await db.query.contacts.findMany({
      where: and(
        eq(contacts.userId, userId),
        or(
          ...searchTerms.map(term => 
            or(
              ilike(contacts.firstName, `%${term}%`),
              ilike(contacts.lastName, `%${term}%`),
              ilike(contacts.displayName, `%${term}%`),
              ilike(contacts.company, `%${term}%`),
              ilike(contacts.jobTitle, `%${term}%`)
            )
          )
        )
      ),
      with: {
        emails: true,
        phones: true,
      },
      limit: 20, // Get more candidates for ranking
    });

    // If no candidates, return empty
    if (candidateContacts.length === 0) {
      return { contacts: [], summary: '', totalFound: 0 };
    }

    // Calculate relevance scores
    const scoredContacts = candidateContacts.map(contact => {
      // Create searchable text from contact
      const searchText = [
        contact.firstName,
        contact.lastName,
        contact.displayName,
        contact.company,
        contact.jobTitle,
        contact.department,
        contact.notes,
        contact.emails?.map((e: any) => e.email).join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Calculate text similarity score
      let score = 0;
      searchTerms.forEach(term => {
        if (searchText.includes(term)) {
          score += 1;
        }
      });

      // Boost score for exact matches in important fields
      if (contact.displayName?.toLowerCase().includes(query.toLowerCase())) {
        score += 3;
      }
      if (contact.company?.toLowerCase().includes(query.toLowerCase())) {
        score += 2;
      }

      // Boost favorites
      if (contact.isFavorite) {
        score += 1;
      }

      return { ...contact, relevanceScore: score };
    });

    // Sort by relevance and take top results
    const topContacts = scoredContacts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    // Generate summary
    const summary = generateContactSummary(topContacts, query);

    return {
      contacts: topContacts,
      summary,
      totalFound: topContacts.length,
    };
  } catch (error) {
    console.error('Error in contact semantic search:', error);
    return { contacts: [], summary: '', totalFound: 0 };
  }
}

/**
 * Get contact communication history
 */
export async function getContactCommunicationContext(
  contactId: string,
  userId: string
): Promise<string> {
  try {
    const timeline = await db.query.contactTimeline.findMany({
      where: and(
        eq(contactTimeline.contactId, contactId),
        eq(contactTimeline.userId, userId)
      ),
      orderBy: [desc(contactTimeline.eventDate)],
      limit: 10,
    });

    if (timeline.length === 0) {
      return 'No recent communication history.';
    }

    const summary = timeline
      .map(
        (event: any) =>
          `${event.eventType}: ${event.title} (${new Date(event.eventDate).toLocaleDateString()})`
      )
      .join('\n');

    return `Recent communication:\n${summary}`;
  } catch (error) {
    console.error('Error getting contact communication context:', error);
    return '';
  }
}

/**
 * Generate human-readable summary from contact search results
 */
function generateContactSummary(contacts: any[], query: string): string {
  if (contacts.length === 0) {
    return `No contacts found matching "${query}".`;
  }

  const summaries = contacts.map((contact: any) => {
    const name = contact.displayName || `${contact.firstName} ${contact.lastName}`.trim();
    const company = contact.company ? ` at ${contact.company}` : '';
    const email = contact.emails?.[0]?.email || '';
    
    return `${name}${company}${email ? ` (${email})` : ''}`;
  });

  if (contacts.length === 1) {
    return `Found contact: ${summaries[0]}`;
  }

  return `Found ${contacts.length} contacts:\n${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
}

/**
 * Search contacts by relationship strength
 */
export async function searchContactsByRelationship(
  userId: string,
  minStrength: number = 50
): Promise<any[]> {
  try {
    const strongContacts = await db.query.contacts.findMany({
      where: and(
        eq(contacts.userId, userId),
        sql`${contacts.relationshipStrength} >= ${minStrength}`
      ),
      orderBy: [desc(contacts.relationshipStrength)],
      limit: 20,
      with: {
        emails: true,
        phones: true,
      },
    });

    return strongContacts;
  } catch (error) {
    console.error('Error searching contacts by relationship:', error);
    return [];
  }
}

