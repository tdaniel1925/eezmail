'use server';

import { db } from '@/lib/db';
import { tasks } from '@/db/schema';
import { eq, and, or, ilike, desc, gte, lte, isNull, isNotNull } from 'drizzle-orm';

/**
 * Semantic search over tasks
 */
export async function searchTasksSemanticRAG(
  query: string,
  userId: string,
  options?: {
    includeCompleted?: boolean;
    dueDateStart?: Date;
    dueDateEnd?: Date;
    limit?: number;
  }
): Promise<{
  tasks: any[];
  summary: string;
  totalFound: number;
}> {
  try {
    const limit = options?.limit || 10;
    const searchTerms = query.toLowerCase().split(' ');

    // Build where clause
    const whereConditions = [eq(tasks.userId, userId)];

    // Filter by completion status
    if (!options?.includeCompleted) {
      whereConditions.push(eq(tasks.completed, false));
    }

    // Add due date range if provided
    if (options?.dueDateStart) {
      whereConditions.push(gte(tasks.dueDate, options.dueDateStart));
    }
    if (options?.dueDateEnd) {
      whereConditions.push(lte(tasks.dueDate, options.dueDateEnd));
    }

    // Add text search conditions
    const textConditions = searchTerms.map(term =>
      or(
        ilike(tasks.title, `%${term}%`),
        ilike(tasks.description, `%${term}%`)
      )
    );

    whereConditions.push(or(...textConditions));

    // Query tasks
    const foundTasks = await db.query.tasks.findMany({
      where: and(...whereConditions),
      orderBy: [desc(tasks.createdAt)],
      limit: limit * 2,
    });

    if (foundTasks.length === 0) {
      return { tasks: [], summary: '', totalFound: 0 };
    }

    // Score and rank tasks
    const scoredTasks = foundTasks.map(task => {
      const searchText = [task.title, task.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      let score = 0;
      searchTerms.forEach(term => {
        if (searchText.includes(term)) {
          score += 1;
        }
      });

      // Boost for exact title match
      if (task.title?.toLowerCase().includes(query.toLowerCase())) {
        score += 3;
      }

      // Boost for high priority
      if (task.priority === 'high') {
        score += 2;
      } else if (task.priority === 'medium') {
        score += 1;
      }

      // Boost for upcoming due dates
      if (task.dueDate) {
        const daysUntilDue = Math.floor(
          (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue >= 0 && daysUntilDue <= 7) {
          score += 2; // Due within a week
        }
      }

      return { ...task, relevanceScore: score };
    });

    const topTasks = scoredTasks
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    const summary = generateTaskSummary(topTasks, query);

    return {
      tasks: topTasks,
      summary,
      totalFound: topTasks.length,
    };
  } catch (error) {
    console.error('Error in task semantic search:', error);
    return { tasks: [], summary: '', totalFound: 0 };
  }
}

/**
 * Get tasks by priority
 */
export async function getTasksByPriority(
  userId: string,
  priority: 'high' | 'medium' | 'low'
): Promise<any[]> {
  try {
    const priorityTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.userId, userId),
        eq(tasks.priority, priority),
        eq(tasks.completed, false)
      ),
      orderBy: [desc(tasks.dueDate)],
      limit: 20,
    });

    return priorityTasks;
  } catch (error) {
    console.error('Error getting tasks by priority:', error);
    return [];
  }
}

/**
 * Get overdue tasks
 */
export async function getOverdueTasks(userId: string): Promise<any[]> {
  try {
    const now = new Date();

    const overdueTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.userId, userId),
        eq(tasks.completed, false),
        isNotNull(tasks.dueDate),
        lte(tasks.dueDate, now)
      ),
      orderBy: [tasks.dueDate],
      limit: 20,
    });

    return overdueTasks;
  } catch (error) {
    console.error('Error getting overdue tasks:', error);
    return [];
  }
}

/**
 * Get task context for AI
 */
export async function getTaskContext(userId: string): Promise<string> {
  try {
    const [incompleteTasks, overdue, highPriority] = await Promise.all([
      db.query.tasks.findMany({
        where: and(eq(tasks.userId, userId), eq(tasks.completed, false)),
        limit: 5,
      }),
      getOverdueTasks(userId),
      getTasksByPriority(userId, 'high'),
    ]);

    const lines: string[] = [];

    if (incompleteTasks.length > 0) {
      lines.push(`${incompleteTasks.length} incomplete tasks`);
    }

    if (overdue.length > 0) {
      lines.push(`${overdue.length} overdue tasks`);
    }

    if (highPriority.length > 0) {
      lines.push(`${highPriority.length} high priority tasks`);
    }

    if (lines.length === 0) {
      return 'No pending tasks.';
    }

    return `Task summary: ${lines.join(', ')}`;
  } catch (error) {
    console.error('Error getting task context:', error);
    return '';
  }
}

/**
 * Generate human-readable summary from task search results
 */
function generateTaskSummary(tasks: any[], query: string): string {
  if (tasks.length === 0) {
    return `No tasks found matching "${query}".`;
  }

  const summaries = tasks.map((task: any) => {
    const priority = task.priority ? ` [${task.priority.toUpperCase()}]` : '';
    const dueDate = task.dueDate
      ? ` - Due: ${new Date(task.dueDate).toLocaleDateString()}`
      : '';
    const status = task.completed ? ' ✓' : '';
    return `${task.title}${priority}${dueDate}${status}`;
  });

  if (tasks.length === 1) {
    return `Found task: ${summaries[0]}`;
  }

  return `Found ${tasks.length} tasks:\n${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
}

/**
 * Parse natural language task priorities
 */
export function parseTaskPriority(input: string): 'high' | 'medium' | 'low' | undefined {
  const lower = input.toLowerCase();

  if (lower.includes('urgent') || lower.includes('critical') || lower.includes('high priority')) {
    return 'high';
  }

  if (lower.includes('medium') || lower.includes('normal')) {
    return 'medium';
  }

  if (lower.includes('low priority') || lower.includes('when possible')) {
    return 'low';
  }

  return undefined;
}

