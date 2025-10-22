/**
 * Autopilot Learning System
 * Tracks user behavior and learns patterns to suggest new rules
 */

'use server';

import { db } from '@/lib/db';
import type {
  AutopilotRule,
  RuleCondition,
  RuleAction,
} from './autopilot-engine';

export interface UserBehaviorPattern {
  patternType:
    | 'sender_action'
    | 'subject_action'
    | 'folder_preference'
    | 'time_pattern'
    | 'bulk_action';
  senderDomain?: string;
  senderEmail?: string;
  subjectKeyword?: string;
  action: string; // archive, delete, move, etc.
  frequency: number; // How many times this pattern occurred
  confidence: number; // 0-100, calculated from consistency
  lastOccurrence: Date;
  metadata?: Record<string, any>;
}

export interface LearnedRule {
  suggestedName: string;
  description: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  confidence: number;
  basedOnPatterns: UserBehaviorPattern[];
  estimatedImpact: string; // "Would have handled 15 emails in the last week"
}

/**
 * Track user action on an email for learning
 */
export async function trackUserAction(
  userId: string,
  emailId: string,
  email: {
    fromAddress: string;
    subject: string;
    folder: string;
  },
  action: {
    type:
      | 'archive'
      | 'delete'
      | 'move'
      | 'star'
      | 'mark_read'
      | 'mark_unread'
      | 'label';
    value?: string; // folder name, label, etc.
  }
): Promise<void> {
  // Log the action to the database
  console.log(
    `Tracking: User ${userId} performed ${action.type} on email ${emailId}`
  );

  // Extract patterns
  const senderDomain = email.fromAddress.split('@')[1];
  const subjectKeywords = extractKeywords(email.subject);

  // Update pattern frequencies
  await updatePatternFrequency(userId, {
    patternType: 'sender_action',
    senderDomain,
    senderEmail: email.fromAddress,
    action: action.type,
  });

  // Check for subject patterns
  for (const keyword of subjectKeywords) {
    await updatePatternFrequency(userId, {
      patternType: 'subject_action',
      subjectKeyword: keyword,
      action: action.type,
    });
  }

  // Check if this should trigger rule suggestion
  await checkForRuleSuggestion(userId);
}

/**
 * Analyze user patterns and suggest rules
 */
export async function analyzeAndSuggestRules(
  userId: string
): Promise<LearnedRule[]> {
  const patterns = await getUserPatterns(userId);

  const suggestions: LearnedRule[] = [];

  // Group patterns by type
  const senderPatterns = patterns.filter(
    (p) => p.patternType === 'sender_action'
  );
  const subjectPatterns = patterns.filter(
    (p) => p.patternType === 'subject_action'
  );

  // Suggest rules for consistent sender actions
  for (const pattern of senderPatterns) {
    if (pattern.frequency >= 5 && pattern.confidence >= 80) {
      const rule = createRuleFromSenderPattern(pattern);
      if (rule) {
        suggestions.push(rule);
      }
    }
  }

  // Suggest rules for consistent subject actions
  for (const pattern of subjectPatterns) {
    if (pattern.frequency >= 10 && pattern.confidence >= 85) {
      const rule = createRuleFromSubjectPattern(pattern);
      if (rule) {
        suggestions.push(rule);
      }
    }
  }

  // Detect newsletter patterns
  const newsletterRule = await detectNewsletterPattern(userId, patterns);
  if (newsletterRule) {
    suggestions.push(newsletterRule);
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Create a rule from sender pattern
 */
function createRuleFromSenderPattern(
  pattern: UserBehaviorPattern
): LearnedRule | null {
  if (!pattern.senderEmail) return null;

  const conditions: RuleCondition[] = [
    {
      type: 'sender',
      operator: 'equals',
      value: pattern.senderEmail,
      caseSensitive: false,
    },
  ];

  const actions: RuleAction[] = [];

  switch (pattern.action) {
    case 'archive':
      actions.push({ type: 'archive' });
      break;
    case 'delete':
      actions.push({ type: 'delete' });
      break;
    case 'move':
      if (pattern.metadata?.folder) {
        actions.push({
          type: 'move_to_folder',
          value: pattern.metadata.folder,
        });
      }
      break;
    case 'mark_read':
      actions.push({ type: 'mark_read' });
      break;
  }

  if (actions.length === 0) return null;

  return {
    suggestedName: `Auto-${pattern.action} emails from ${pattern.senderEmail}`,
    description: `You always ${pattern.action} emails from this sender`,
    conditions,
    actions,
    confidence: pattern.confidence,
    basedOnPatterns: [pattern],
    estimatedImpact: `Would have handled ${pattern.frequency} emails automatically`,
  };
}

/**
 * Create a rule from subject pattern
 */
function createRuleFromSubjectPattern(
  pattern: UserBehaviorPattern
): LearnedRule | null {
  if (!pattern.subjectKeyword) return null;

  const conditions: RuleCondition[] = [
    {
      type: 'subject',
      operator: 'contains',
      value: pattern.subjectKeyword,
      caseSensitive: false,
    },
  ];

  const actions: RuleAction[] = [];

  switch (pattern.action) {
    case 'archive':
      actions.push({ type: 'archive' });
      break;
    case 'delete':
      actions.push({ type: 'delete' });
      break;
    case 'move':
      if (pattern.metadata?.folder) {
        actions.push({
          type: 'move_to_folder',
          value: pattern.metadata.folder,
        });
      }
      break;
  }

  if (actions.length === 0) return null;

  return {
    suggestedName: `Auto-${pattern.action} emails with "${pattern.subjectKeyword}"`,
    description: `You always ${pattern.action} emails containing this keyword`,
    conditions,
    actions,
    confidence: pattern.confidence,
    basedOnPatterns: [pattern],
    estimatedImpact: `Would have handled ${pattern.frequency} emails automatically`,
  };
}

/**
 * Detect newsletter pattern
 */
async function detectNewsletterPattern(
  userId: string,
  patterns: UserBehaviorPattern[]
): Promise<LearnedRule | null> {
  // Look for patterns where user consistently archives/deletes emails with "newsletter", "unsubscribe", etc.
  const newsletterKeywords = [
    'newsletter',
    'unsubscribe',
    'weekly digest',
    'daily update',
  ];

  const newsletterPatterns = patterns.filter(
    (p) =>
      p.patternType === 'subject_action' &&
      p.subjectKeyword &&
      newsletterKeywords.some((kw) =>
        p.subjectKeyword?.toLowerCase().includes(kw)
      ) &&
      (p.action === 'archive' || p.action === 'delete')
  );

  if (
    newsletterPatterns.length === 0 ||
    newsletterPatterns.reduce((sum, p) => sum + p.frequency, 0) < 10
  ) {
    return null;
  }

  const totalFrequency = newsletterPatterns.reduce(
    (sum, p) => sum + p.frequency,
    0
  );
  const avgConfidence =
    newsletterPatterns.reduce((sum, p) => sum + p.confidence, 0) /
    newsletterPatterns.length;

  return {
    suggestedName: 'Auto-archive newsletters',
    description: 'Automatically archive emails that look like newsletters',
    conditions: [
      {
        type: 'body',
        operator: 'contains',
        value: 'unsubscribe',
        caseSensitive: false,
      },
    ],
    actions: [{ type: 'archive' }, { type: 'mark_read' }],
    confidence: avgConfidence,
    basedOnPatterns: newsletterPatterns,
    estimatedImpact: `Would have handled ${totalFrequency} newsletter emails automatically`,
  };
}

/**
 * Extract meaningful keywords from subject
 */
function extractKeywords(subject: string): string[] {
  // Remove common words
  const stopWords = [
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
  ];

  const words = subject
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.includes(word));

  // Return top 3 keywords
  return words.slice(0, 3);
}

/**
 * Get user behavior patterns from database
 */
async function getUserPatterns(userId: string): Promise<UserBehaviorPattern[]> {
  // This would query your database
  // Returning empty array for now
  return [];
}

/**
 * Update pattern frequency in database
 */
async function updatePatternFrequency(
  userId: string,
  pattern: Partial<UserBehaviorPattern>
): Promise<void> {
  // This would update your database
  console.log(`Updated pattern frequency for user ${userId}:`, pattern);
}

/**
 * Check if patterns suggest creating a new rule
 */
async function checkForRuleSuggestion(userId: string): Promise<void> {
  // Check if any patterns have crossed the threshold for suggestion
  const suggestions = await analyzeAndSuggestRules(userId);

  if (suggestions.length > 0) {
    // Notify user about new rule suggestions
    console.log(
      `New rule suggestions available for user ${userId}:`,
      suggestions.length
    );
  }
}

/**
 * Calculate confidence score for a pattern
 */
export function calculatePatternConfidence(
  occurrences: number,
  totalEmails: number,
  consistency: number // 0-1, how consistent the action is
): number {
  // Confidence increases with:
  // 1. More occurrences
  // 2. Higher consistency
  // 3. Higher percentage of emails affected

  const occurrenceScore = Math.min(occurrences / 10, 1) * 40; // Max 40 points
  const consistencyScore = consistency * 40; // Max 40 points
  const percentageScore = Math.min((occurrences / totalEmails) * 100, 20); // Max 20 points

  return Math.round(occurrenceScore + consistencyScore + percentageScore);
}
