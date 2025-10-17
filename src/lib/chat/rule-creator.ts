import { db } from '@/lib/db';
import { emailRules, customFolders } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

interface RuleCondition {
  field: 'from' | 'to' | 'subject' | 'body';
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with';
  value: string;
}

interface RuleAction {
  type: 'move' | 'archive' | 'star' | 'mark_read' | 'delete';
  value?: string; // folder name for move action
}

interface EmailRuleData {
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority?: number;
}

/**
 * Create an email rule from structured data
 */
export async function createEmailRule(
  userId: string,
  ruleData: EmailRuleData
): Promise<any> {
  try {
    // Validate rule data
    if (!ruleData.name || !ruleData.conditions || !ruleData.actions) {
      throw new Error(
        'Invalid rule data: name, conditions, and actions are required'
      );
    }

    if (ruleData.conditions.length === 0) {
      throw new Error('At least one condition is required');
    }

    if (ruleData.actions.length === 0) {
      throw new Error('At least one action is required');
    }

    // Check if a move action requires a folder that exists
    for (const action of ruleData.actions) {
      if (action.type === 'move' && action.value) {
        const folderName = action.value.toLowerCase();

        // Check if folder exists (case-insensitive)
        const existingFolder = await db
          .select()
          .from(customFolders)
          .where(
            and(
              eq(customFolders.userId, userId),
              sql`LOWER(${customFolders.name}) = ${folderName}`
            )
          )
          .limit(1);

        // If folder doesn't exist, create it
        if (existingFolder.length === 0) {
          await db.insert(customFolders).values({
            userId,
            name: action.value,
            color: '#6B7280', // Default gray color
          } as any);
        }
      }
    }

    // Create the rule
    const [newRule] = await db
      .insert(emailRules)
      .values({
        userId,
        name: ruleData.name,
        conditions: ruleData.conditions,
        actions: ruleData.actions,
        priority: ruleData.priority || 0,
        isActive: true,
      } as any)
      .returning();

    return {
      success: true,
      rule: newRule,
      message: `Email rule "${ruleData.name}" created successfully`,
    };
  } catch (error) {
    console.error('Error creating email rule:', error);
    throw error;
  }
}

/**
 * Parse natural language into a rule
 * Examples:
 * - "when email comes from john@example.com, move to Work folder"
 * - "if subject contains 'invoice', star and move to Invoices"
 * - "emails from Sarah should be marked as read and archived"
 */
export function parseNaturalLanguageRule(text: string): EmailRuleData | null {
  const lowerText = text.toLowerCase();

  // Extract sender email or name
  const fromMatch = lowerText.match(
    /(?:from|comes from|sent by)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z\s]+)/i
  );

  // Extract subject keywords
  const subjectMatch = lowerText.match(
    /subject\s+(?:contains|includes|has)\s+['"]([^'"]+)['"]/i
  );

  // Extract body keywords
  const bodyMatch = lowerText.match(
    /body\s+(?:contains|includes|has)\s+['"]([^'"]+)['"]/i
  );

  // Extract actions
  const moveMatch = lowerText.match(
    /move\s+to\s+([a-zA-Z0-9\s]+?)(?:\s+folder)?(?:\s|$|,|and)/i
  );
  const shouldArchive = lowerText.includes('archive');
  const shouldStar = lowerText.includes('star');
  const shouldMarkRead =
    lowerText.includes('mark') && lowerText.includes('read');
  const shouldDelete = lowerText.includes('delete');

  // Build conditions
  const conditions: RuleCondition[] = [];

  if (fromMatch) {
    const sender = fromMatch[1].trim();
    conditions.push({
      field: 'from',
      operator: sender.includes('@') ? 'equals' : 'contains',
      value: sender,
    });
  }

  if (subjectMatch) {
    conditions.push({
      field: 'subject',
      operator: 'contains',
      value: subjectMatch[1],
    });
  }

  if (bodyMatch) {
    conditions.push({
      field: 'body',
      operator: 'contains',
      value: bodyMatch[1],
    });
  }

  // Build actions
  const actions: RuleAction[] = [];

  if (moveMatch) {
    const folderName = moveMatch[1].trim();
    actions.push({
      type: 'move',
      value: folderName,
    });
  }

  if (shouldArchive) {
    actions.push({ type: 'archive' });
  }

  if (shouldStar) {
    actions.push({ type: 'star' });
  }

  if (shouldMarkRead) {
    actions.push({ type: 'mark_read' });
  }

  if (shouldDelete) {
    actions.push({ type: 'delete' });
  }

  // Return null if no valid conditions or actions found
  if (conditions.length === 0 || actions.length === 0) {
    return null;
  }

  // Generate rule name
  let ruleName = 'Auto Rule';
  if (fromMatch) {
    ruleName = `Rule for ${fromMatch[1]}`;
  } else if (subjectMatch) {
    ruleName = `Rule for "${subjectMatch[1]}"`;
  }

  return {
    name: ruleName,
    conditions,
    actions,
    priority: 0,
  };
}

/**
 * Update an existing email rule
 */
export async function updateEmailRule(
  userId: string,
  ruleId: string,
  updates: Partial<EmailRuleData> & { isActive?: boolean }
): Promise<any> {
  try {
    const [updatedRule] = await db
      .update(emailRules)
      .set({
        ...(updates.name && { name: updates.name }),
        ...(updates.conditions && { conditions: updates.conditions }),
        ...(updates.actions && { actions: updates.actions }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      })
      .where(and(eq(emailRules.id, ruleId), eq(emailRules.userId, userId)))
      .returning();

    if (!updatedRule) {
      throw new Error('Rule not found');
    }

    return {
      success: true,
      rule: updatedRule,
      message: 'Email rule updated successfully',
    };
  } catch (error) {
    console.error('Error updating email rule:', error);
    throw error;
  }
}

/**
 * Delete an email rule
 */
export async function deleteEmailRule(
  userId: string,
  ruleId: string
): Promise<any> {
  try {
    const deleted = await db
      .delete(emailRules)
      .where(and(eq(emailRules.id, ruleId), eq(emailRules.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      throw new Error('Rule not found');
    }

    return {
      success: true,
      message: 'Email rule deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting email rule:', error);
    throw error;
  }
}

/**
 * Get all rules for a user
 */
export async function getUserRules(userId: string): Promise<any[]> {
  try {
    const rules = await db
      .select()
      .from(emailRules)
      .where(eq(emailRules.userId, userId))
      .orderBy(emailRules.priority);

    return rules;
  } catch (error) {
    console.error('Error fetching user rules:', error);
    throw error;
  }
}
