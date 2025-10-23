'use server';

import { buildContextForQuery } from './context';
import {
  searchContactsSemanticRAG,
  getContactCommunicationContext,
} from './contact-search';
import {
  searchCalendarSemanticRAG,
  getUpcomingEventsContext,
} from './calendar-search';
import { searchTasksSemanticRAG, getTaskContext } from './task-search';
import {
  searchSettingsRAG,
  getUserRulesContext,
  getUserSignaturesContext,
  getUserFoldersContext,
} from './settings-search';

export interface OmniscientSearchOptions {
  includeEmails?: boolean;
  includeContacts?: boolean;
  includeCalendar?: boolean;
  includeTasks?: boolean;
  includeSettings?: boolean;
  emailLimit?: number;
  contactLimit?: number;
  calendarLimit?: number;
  taskLimit?: number;
}

export interface OmniscientSearchResult {
  emails: {
    results: any[];
    summary: string;
    totalFound: number;
  };
  contacts: {
    results: any[];
    summary: string;
    totalFound: number;
  };
  calendar: {
    results: any[];
    summary: string;
    totalFound: number;
  };
  tasks: {
    results: any[];
    summary: string;
    totalFound: number;
  };
  settings: {
    rules: any[];
    signatures: any[];
    folders: any[];
    settings: any;
    summary: string;
  };
  overallSummary: string;
  totalResults: number;
}

/**
 * Omniscient search across ALL user data
 * This is the AI's eyes - it sees everything
 */
export async function omniscientSearch(
  query: string,
  userId: string,
  options: OmniscientSearchOptions = {}
): Promise<OmniscientSearchResult> {
  // Default to searching everything
  const opts = {
    includeEmails: options.includeEmails !== false,
    includeContacts: options.includeContacts !== false,
    includeCalendar: options.includeCalendar !== false,
    includeTasks: options.includeTasks !== false,
    includeSettings: options.includeSettings !== false,
    emailLimit: options.emailLimit || 5,
    contactLimit: options.contactLimit || 5,
    calendarLimit: options.calendarLimit || 5,
    taskLimit: options.taskLimit || 5,
  };

  console.log(`🔍 [Omniscient Search] Query: "${query}" for user: ${userId}`);

  // Execute all searches in parallel for speed
  const [
    emailResults,
    contactResults,
    calendarResults,
    taskResults,
    settingsResults,
  ] = await Promise.all([
    opts.includeEmails
      ? buildContextForQuery(query, userId, opts.emailLimit)
      : Promise.resolve({ results: [], summary: '', totalFound: 0 }),
    opts.includeContacts
      ? searchContactsSemanticRAG(query, userId, opts.contactLimit)
      : Promise.resolve({ contacts: [], summary: '', totalFound: 0 }),
    opts.includeCalendar
      ? searchCalendarSemanticRAG(query, userId, { limit: opts.calendarLimit })
      : Promise.resolve({ events: [], summary: '', totalFound: 0 }),
    opts.includeTasks
      ? searchTasksSemanticRAG(query, userId, { limit: opts.taskLimit })
      : Promise.resolve({ tasks: [], summary: '', totalFound: 0 }),
    opts.includeSettings
      ? searchSettingsRAG(query, userId)
      : Promise.resolve({
          rules: [],
          signatures: [],
          folders: [],
          settings: null,
          summary: '',
        }),
  ]);

  // Calculate total results
  const totalResults =
    emailResults.totalFound +
    contactResults.totalFound +
    calendarResults.totalFound +
    taskResults.totalFound +
    settingsResults.rules.length +
    settingsResults.signatures.length +
    settingsResults.folders.length;

  // Build overall summary
  const overallSummary = buildOverallSummary(
    emailResults,
    contactResults,
    calendarResults,
    taskResults,
    settingsResults,
    query
  );

  console.log(
    `✅ [Omniscient Search] Found ${totalResults} total results across all categories`
  );

  return {
    emails: {
      results: emailResults.results || [],
      summary: emailResults.summary || '',
      totalFound: emailResults.totalFound || 0,
    },
    contacts: {
      results: contactResults.contacts || [],
      summary: contactResults.summary || '',
      totalFound: contactResults.totalFound || 0,
    },
    calendar: {
      results: calendarResults.events || [],
      summary: calendarResults.summary || '',
      totalFound: calendarResults.totalFound || 0,
    },
    tasks: {
      results: taskResults.tasks || [],
      summary: taskResults.summary || '',
      totalFound: taskResults.totalFound || 0,
    },
    settings: settingsResults,
    overallSummary,
    totalResults,
  };
}

/**
 * Get comprehensive user context for the AI
 * This gives the AI situational awareness
 */
export async function getUserContext(userId: string): Promise<string> {
  console.log(`📊 [User Context] Building context for user: ${userId}`);

  const [
    upcomingEvents,
    taskContext,
    rulesContext,
    signaturesContext,
    foldersContext,
  ] = await Promise.all([
    getUpcomingEventsContext(userId, 7),
    getTaskContext(userId),
    getUserRulesContext(userId),
    getUserSignaturesContext(userId),
    getUserFoldersContext(userId),
  ]);

  const contextParts = [
    upcomingEvents,
    taskContext,
    rulesContext,
    signaturesContext,
    foldersContext,
  ].filter(Boolean);

  const fullContext = contextParts.join('\n');

  console.log(
    `✅ [User Context] Built ${contextParts.length} context sections`
  );

  return fullContext || 'No additional context available.';
}

/**
 * Build human-readable summary from all search results
 */
function buildOverallSummary(
  emails: any,
  contacts: any,
  calendar: any,
  tasks: any,
  settings: any,
  query: string
): string {
  const sections: string[] = [];

  if (emails.totalFound > 0) {
    sections.push(
      `${emails.totalFound} email${emails.totalFound === 1 ? '' : 's'}`
    );
  }

  if (contacts.totalFound > 0) {
    sections.push(
      `${contacts.totalFound} contact${contacts.totalFound === 1 ? '' : 's'}`
    );
  }

  if (calendar.totalFound > 0) {
    sections.push(
      `${calendar.totalFound} event${calendar.totalFound === 1 ? '' : 's'}`
    );
  }

  if (tasks.totalFound > 0) {
    sections.push(
      `${tasks.totalFound} task${tasks.totalFound === 1 ? '' : 's'}`
    );
  }

  const settingsCount =
    settings.rules.length +
    settings.signatures.length +
    settings.folders.length;
  if (settingsCount > 0) {
    sections.push(
      `${settingsCount} setting${settingsCount === 1 ? '' : 's'}/rule${settingsCount === 1 ? '' : 's'}`
    );
  }

  if (sections.length === 0) {
    return `No results found for "${query}".`;
  }

  return `Found ${sections.join(', ')} matching "${query}".`;
}
