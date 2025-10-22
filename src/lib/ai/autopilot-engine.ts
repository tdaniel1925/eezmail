/**
 * Email Autopilot Rules Engine
 * Automatic email handling based on user-defined rules and learned patterns
 */

'use server';

import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export interface AutopilotRule {
  id: string;
  userId: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  trustLevel: 'suggest' | 'review' | 'auto';
  confidence: number; // 0-100, learned from user behavior
  learnFromCorrections: boolean;
  priority: number; // Higher = runs first
  createdAt: Date;
  lastExecuted?: Date;
  executionCount: number;
  successRate: number; // 0-100
}

export interface RuleCondition {
  type:
    | 'sender'
    | 'subject'
    | 'body'
    | 'has_attachment'
    | 'attachment_type'
    | 'domain'
    | 'keyword'
    | 'time'
    | 'importance'
    | 'custom';
  operator:
    | 'equals'
    | 'contains'
    | 'starts_with'
    | 'ends_with'
    | 'regex'
    | 'not'
    | 'any';
  value: string | number | boolean | string[];
  caseSensitive?: boolean;
}

export interface RuleAction {
  type:
    | 'archive'
    | 'delete'
    | 'move_to_folder'
    | 'mark_read'
    | 'mark_unread'
    | 'star'
    | 'unstar'
    | 'label'
    | 'forward'
    | 'reply'
    | 'draft_reply'
    | 'snooze'
    | 'notify'
    | 'custom';
  value?: string | number | Record<string, any>;
  params?: Record<string, any>;
}

export interface EmailToProcess {
  id: string;
  accountId: string;
  fromAddress: string;
  fromName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  hasAttachments: boolean;
  attachmentTypes?: string[];
  receivedAt: Date;
  importance?: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

export interface AutopilotExecutionResult {
  emailId: string;
  matchedRules: Array<{
    ruleId: string;
    ruleName: string;
    trustLevel: 'suggest' | 'review' | 'auto';
    actions: RuleAction[];
    executed: boolean;
    error?: string;
  }>;
  suggestedActions: Array<{
    ruleId: string;
    ruleName: string;
    actions: RuleAction[];
    reason: string;
  }>;
  actionsExecuted: number;
  actionsQueued: number;
}

/**
 * Execute autopilot rules for an email
 */
export async function executeAutopilot(
  email: EmailToProcess,
  userId: string
): Promise<AutopilotExecutionResult> {
  // Get active rules for user, sorted by priority
  const rules = await getActiveRules(userId);

  const result: AutopilotExecutionResult = {
    emailId: email.id,
    matchedRules: [],
    suggestedActions: [],
    actionsExecuted: 0,
    actionsQueued: 0,
  };

  // Check each rule against the email
  for (const rule of rules) {
    const matches = await evaluateRule(rule, email);

    if (matches) {
      // Rule matched! Decide what to do based on trust level
      if (rule.trustLevel === 'auto' && rule.confidence >= 80) {
        // Execute automatically
        try {
          await executeActions(rule.actions, email);

          result.matchedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            trustLevel: rule.trustLevel,
            actions: rule.actions,
            executed: true,
          });

          result.actionsExecuted += rule.actions.length;

          // Log execution
          await logRuleExecution(rule.id, email.id, 'executed', rule.actions);

          // Update rule execution count and last executed
          await updateRuleStats(rule.id, true);
        } catch (error) {
          console.error(`Failed to execute rule ${rule.id}:`, error);
          result.matchedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            trustLevel: rule.trustLevel,
            actions: rule.actions,
            executed: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } else if (rule.trustLevel === 'review') {
        // Queue for user review
        await queueForReview(rule, email);

        result.matchedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          trustLevel: rule.trustLevel,
          actions: rule.actions,
          executed: false,
        });

        result.actionsQueued += rule.actions.length;
      } else {
        // Just suggest (low confidence or 'suggest' mode)
        result.suggestedActions.push({
          ruleId: rule.id,
          ruleName: rule.name,
          actions: rule.actions,
          reason: `Based on: ${rule.description || 'rule conditions'}`,
        });
      }
    }
  }

  return result;
}

/**
 * Evaluate if a rule matches an email
 */
async function evaluateRule(
  rule: AutopilotRule,
  email: EmailToProcess
): Promise<boolean> {
  // All conditions must match (AND logic)
  for (const condition of rule.conditions) {
    if (!(await evaluateCondition(condition, email))) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate a single condition
 */
async function evaluateCondition(
  condition: RuleCondition,
  email: EmailToProcess
): Promise<boolean> {
  let actualValue: string | boolean | number | undefined;

  // Get the actual value from the email
  switch (condition.type) {
    case 'sender':
      actualValue = email.fromAddress;
      break;
    case 'subject':
      actualValue = email.subject;
      break;
    case 'body':
      actualValue = email.bodyText;
      break;
    case 'has_attachment':
      actualValue = email.hasAttachments;
      break;
    case 'domain':
      actualValue = email.fromAddress.split('@')[1];
      break;
    default:
      actualValue = undefined;
  }

  if (actualValue === undefined) {
    return false;
  }

  // Apply operator
  const expectedValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      if (
        condition.caseSensitive === false &&
        typeof actualValue === 'string'
      ) {
        return (
          actualValue.toLowerCase() === String(expectedValue).toLowerCase()
        );
      }
      return actualValue === expectedValue;

    case 'contains':
      if (typeof actualValue === 'string') {
        const searchValue = String(expectedValue);
        if (condition.caseSensitive === false) {
          return actualValue.toLowerCase().includes(searchValue.toLowerCase());
        }
        return actualValue.includes(searchValue);
      }
      return false;

    case 'starts_with':
      if (typeof actualValue === 'string') {
        const searchValue = String(expectedValue);
        if (condition.caseSensitive === false) {
          return actualValue
            .toLowerCase()
            .startsWith(searchValue.toLowerCase());
        }
        return actualValue.startsWith(searchValue);
      }
      return false;

    case 'ends_with':
      if (typeof actualValue === 'string') {
        const searchValue = String(expectedValue);
        if (condition.caseSensitive === false) {
          return actualValue.toLowerCase().endsWith(searchValue.toLowerCase());
        }
        return actualValue.endsWith(searchValue);
      }
      return false;

    case 'regex':
      if (typeof actualValue === 'string') {
        const regex = new RegExp(
          String(expectedValue),
          condition.caseSensitive === false ? 'i' : ''
        );
        return regex.test(actualValue);
      }
      return false;

    case 'not':
      // Recursively evaluate with negation
      const tempCondition = { ...condition, operator: 'equals' as const };
      return !(await evaluateCondition(tempCondition, email));

    case 'any':
      if (Array.isArray(expectedValue)) {
        return expectedValue.some((val) => actualValue === val);
      }
      return false;

    default:
      return false;
  }
}

/**
 * Execute actions for a matched rule
 */
async function executeActions(
  actions: RuleAction[],
  email: EmailToProcess
): Promise<void> {
  for (const action of actions) {
    try {
      await executeAction(action, email);
    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
      throw error;
    }
  }
}

/**
 * Execute a single action
 */
async function executeAction(
  action: RuleAction,
  email: EmailToProcess
): Promise<void> {
  // Implementation will depend on your existing email action APIs
  // This is a simplified version

  switch (action.type) {
    case 'archive':
      // Call your archive API
      console.log(`Archiving email ${email.id}`);
      break;

    case 'delete':
      // Call your delete API
      console.log(`Deleting email ${email.id}`);
      break;

    case 'move_to_folder':
      // Call your move API
      console.log(`Moving email ${email.id} to folder ${action.value}`);
      break;

    case 'mark_read':
      // Call your mark read API
      console.log(`Marking email ${email.id} as read`);
      break;

    case 'mark_unread':
      // Call your mark unread API
      console.log(`Marking email ${email.id} as unread`);
      break;

    case 'star':
      // Call your star API
      console.log(`Starring email ${email.id}`);
      break;

    case 'label':
      // Call your label API
      console.log(`Adding label ${action.value} to email ${email.id}`);
      break;

    case 'forward':
      // Call your forward API
      console.log(`Forwarding email ${email.id} to ${action.value}`);
      break;

    case 'draft_reply':
      // Generate AI reply draft
      console.log(`Creating draft reply for email ${email.id}`);
      break;

    case 'snooze':
      // Call your snooze API
      console.log(`Snoozing email ${email.id} until ${action.value}`);
      break;

    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
}

/**
 * Get active rules for a user
 */
async function getActiveRules(userId: string): Promise<AutopilotRule[]> {
  // This would query your database
  // Returning empty array for now - you'll implement based on your schema
  return [];
}

/**
 * Queue email for manual review
 */
async function queueForReview(
  rule: AutopilotRule,
  email: EmailToProcess
): Promise<void> {
  // Store in database for user to review later
  console.log(`Queued email ${email.id} for review (rule: ${rule.name})`);
}

/**
 * Log rule execution for learning
 */
async function logRuleExecution(
  ruleId: string,
  emailId: string,
  status: 'executed' | 'failed' | 'undone',
  actions: RuleAction[]
): Promise<void> {
  // Log to database for analytics and learning
  console.log(
    `Logged execution: Rule ${ruleId} on Email ${emailId} - ${status}`
  );
}

/**
 * Update rule statistics
 */
async function updateRuleStats(
  ruleId: string,
  success: boolean
): Promise<void> {
  // Update execution count, success rate, last executed timestamp
  console.log(`Updated stats for rule ${ruleId}: success=${success}`);
}

/**
 * Learn from user corrections
 */
export async function learnFromCorrection(
  ruleId: string,
  emailId: string,
  userAction: 'approved' | 'rejected' | 'modified',
  modifications?: Partial<AutopilotRule>
): Promise<void> {
  // Adjust rule confidence based on user feedback
  // If user consistently rejects, lower confidence
  // If user consistently approves, increase confidence
  // If user modifies, update the rule

  console.log(
    `Learning from correction: Rule ${ruleId}, Email ${emailId}, Action: ${userAction}`
  );

  // Example learning logic:
  if (userAction === 'approved') {
    // Increase confidence slightly
    // await increaseRuleConfidence(ruleId, 5);
  } else if (userAction === 'rejected') {
    // Decrease confidence
    // await decreaseRuleConfidence(ruleId, 10);
  } else if (userAction === 'modified' && modifications) {
    // Update rule with modifications
    // await updateRule(ruleId, modifications);
  }
}

/**
 * Suggest new rules based on user patterns
 */
export async function suggestNewRules(
  userId: string
): Promise<AutopilotRule[]> {
  // Analyze user behavior patterns
  // Suggest new rules based on repeated actions

  // Example patterns to detect:
  // - Always archives emails from certain senders
  // - Always marks certain subjects as read
  // - Always moves newsletters to a folder

  return [];
}
