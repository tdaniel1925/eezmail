/**
 * Email Rule Actions
 * Server actions for managing email rules/filters
 */

'use server';

import { db } from '@/lib/db';
import { emailRules, emailAccounts } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface RuleCondition {
  field: string;
  operator: string;
  value: string | boolean | number;
}

export interface RuleAction {
  type: string;
  value?: string | boolean;
}

export interface RuleData {
  name: string;
  description?: string;
  conditions: {
    logic: 'AND' | 'OR';
    rules: RuleCondition[];
  };
  actions: RuleAction[];
  isEnabled?: boolean;
  priority?: number;
  stopProcessing?: boolean;
  accountId?: string | null;
}

/**
 * Get all rules for the current user
 */
export async function getRules() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const rules = await db.query.emailRules.findMany({
      where: (rules, { eq }) => eq(rules.userId, user.id),
      orderBy: [asc(emailRules.priority), desc(emailRules.createdAt)],
    });

    return { success: true, rules };
  } catch (error) {
    console.error('Error fetching rules:', error);
    return { success: false, error: 'Failed to fetch rules' };
  }
}

/**
 * Get a single rule by ID
 */
export async function getRule(ruleId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const rule = await db.query.emailRules.findFirst({
      where: (rules, { and, eq }) =>
        and(eq(rules.id, ruleId), eq(rules.userId, user.id)),
    });

    if (!rule) {
      return { success: false, error: 'Rule not found' };
    }

    return { success: true, rule };
  } catch (error) {
    console.error('Error fetching rule:', error);
    return { success: false, error: 'Failed to fetch rule' };
  }
}

/**
 * Create a new rule
 */
export async function createRule(data: RuleData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate conditions
    if (
      !data.conditions ||
      !data.conditions.rules ||
      data.conditions.rules.length === 0
    ) {
      return { success: false, error: 'At least one condition is required' };
    }

    // Validate actions
    if (!data.actions || data.actions.length === 0) {
      return { success: false, error: 'At least one action is required' };
    }

    // Validate account ownership if accountId is provided
    if (data.accountId) {
      const account = await db.query.emailAccounts.findFirst({
        where: (accounts, { and, eq }) =>
          and(eq(accounts.id, data.accountId!), eq(accounts.userId, user.id)),
      });

      if (!account) {
        return { success: false, error: 'Invalid account ID' };
      }
    }

    const [rule] = await db
      .insert(emailRules)
      .values({
        userId: user.id,
        accountId: data.accountId || null,
        name: data.name,
        description: data.description,
        conditions: data.conditions,
        actions: data.actions,
        isEnabled: data.isEnabled !== false,
        priority: data.priority || 0,
        stopProcessing: data.stopProcessing || false,
      })
      .returning();

    revalidatePath('/dashboard/settings');

    return { success: true, rule };
  } catch (error) {
    console.error('Error creating rule:', error);
    return { success: false, error: 'Failed to create rule' };
  }
}

/**
 * Update an existing rule
 */
export async function updateRule(ruleId: string, data: Partial<RuleData>) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify ownership
    const existing = await db.query.emailRules.findFirst({
      where: (rules, { and, eq }) =>
        and(eq(rules.id, ruleId), eq(rules.userId, user.id)),
    });

    if (!existing) {
      return { success: false, error: 'Rule not found' };
    }

    // Validate conditions if provided
    if (data.conditions) {
      if (!data.conditions.rules || data.conditions.rules.length === 0) {
        return { success: false, error: 'At least one condition is required' };
      }
    }

    // Validate actions if provided
    if (data.actions) {
      if (data.actions.length === 0) {
        return { success: false, error: 'At least one action is required' };
      }
    }

    // Validate account ownership if accountId is being updated
    if (data.accountId !== undefined && data.accountId !== null) {
      const account = await db.query.emailAccounts.findFirst({
        where: (accounts, { and, eq }) =>
          and(eq(accounts.id, data.accountId!), eq(accounts.userId, user.id)),
      });

      if (!account) {
        return { success: false, error: 'Invalid account ID' };
      }
    }

    const [rule] = await db
      .update(emailRules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(emailRules.id, ruleId), eq(emailRules.userId, user.id)))
      .returning();

    revalidatePath('/dashboard/settings');

    return { success: true, rule };
  } catch (error) {
    console.error('Error updating rule:', error);
    return { success: false, error: 'Failed to update rule' };
  }
}

/**
 * Delete a rule
 */
export async function deleteRule(ruleId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    await db
      .delete(emailRules)
      .where(and(eq(emailRules.id, ruleId), eq(emailRules.userId, user.id)));

    revalidatePath('/dashboard/settings');

    return { success: true, message: 'Rule deleted successfully' };
  } catch (error) {
    console.error('Error deleting rule:', error);
    return { success: false, error: 'Failed to delete rule' };
  }
}

/**
 * Toggle rule enabled/disabled
 */
export async function toggleRule(ruleId: string, isEnabled: boolean) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const [rule] = await db
      .update(emailRules)
      .set({ isEnabled, updatedAt: new Date() })
      .where(and(eq(emailRules.id, ruleId), eq(emailRules.userId, user.id)))
      .returning();

    if (!rule) {
      return { success: false, error: 'Rule not found' };
    }

    revalidatePath('/dashboard/settings');

    return { success: true, rule };
  } catch (error) {
    console.error('Error toggling rule:', error);
    return { success: false, error: 'Failed to toggle rule' };
  }
}

/**
 * Update rule priorities (reorder rules)
 */
export async function updateRulePriorities(ruleIds: string[]) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Update each rule's priority based on its position in the array
    for (let i = 0; i < ruleIds.length; i++) {
      await db
        .update(emailRules)
        .set({ priority: i, updatedAt: new Date() })
        .where(
          and(eq(emailRules.id, ruleIds[i]), eq(emailRules.userId, user.id))
        );
    }

    revalidatePath('/dashboard/settings');

    return { success: true, message: 'Rule priorities updated successfully' };
  } catch (error) {
    console.error('Error updating rule priorities:', error);
    return { success: false, error: 'Failed to update rule priorities' };
  }
}

/**
 * Test a rule against sample data (dry run)
 */
export async function testRule(
  ruleData: RuleData,
  sampleEmail: {
    from: string;
    to: string;
    subject: string;
    body: string;
    hasAttachment: boolean;
    isStarred: boolean;
    isImportant: boolean;
  }
) {
  try {
    const matches = evaluateRuleConditions(ruleData.conditions, sampleEmail);

    return {
      success: true,
      matches,
      message: matches
        ? 'Rule would match this email'
        : 'Rule would not match this email',
    };
  } catch (error) {
    console.error('Error testing rule:', error);
    return { success: false, error: 'Failed to test rule' };
  }
}

/**
 * Helper function to evaluate rule conditions
 */
function evaluateRuleConditions(
  conditions: { logic: 'AND' | 'OR'; rules: RuleCondition[] },
  email: any
): boolean {
  const results = conditions.rules.map((rule) => {
    const fieldValue = email[rule.field];
    const ruleValue = rule.value;

    switch (rule.operator) {
      case 'contains':
        return String(fieldValue)
          .toLowerCase()
          .includes(String(ruleValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue)
          .toLowerCase()
          .includes(String(ruleValue).toLowerCase());
      case 'equals':
        return (
          String(fieldValue).toLowerCase() === String(ruleValue).toLowerCase()
        );
      case 'not_equals':
        return (
          String(fieldValue).toLowerCase() !== String(ruleValue).toLowerCase()
        );
      case 'starts_with':
        return String(fieldValue)
          .toLowerCase()
          .startsWith(String(ruleValue).toLowerCase());
      case 'ends_with':
        return String(fieldValue)
          .toLowerCase()
          .endsWith(String(ruleValue).toLowerCase());
      case 'is_true':
        return Boolean(fieldValue) === true;
      case 'is_false':
        return Boolean(fieldValue) === false;
      case 'matches_regex':
        try {
          const regex = new RegExp(String(ruleValue), 'i');
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      default:
        return false;
    }
  });

  return conditions.logic === 'AND'
    ? results.every((r) => r)
    : results.some((r) => r);
}
