'use server';

import { db } from '@/lib/db';
import { tasks } from '@/db/schema';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Create a new task
 */
export async function createTask(params: {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  emailId?: string;
}): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: user.id,
        title: params.title,
        description: params.description,
        priority: params.priority || 'medium',
        dueDate: params.dueDate,
        emailId: params.emailId,
      })
      .returning();

    revalidatePath('/dashboard');
    return { success: true, taskId: newTask.id };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: 'Failed to create task' };
  }
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    completed?: boolean;
    dueDate?: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.userId !== user.id) {
      return { success: false, error: 'Task not found' };
    }

    // If marking as completed, set completedAt
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.completed === true && !task.completed) {
      updateData.completedAt = new Date();
      updateData.status = 'completed';
    } else if (updates.completed === false) {
      updateData.completedAt = null;
    }

    await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating task:', error);
    return { success: false, error: 'Failed to update task' };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.userId !== user.id) {
      return { success: false, error: 'Task not found' };
    }

    await db.delete(tasks).where(eq(tasks.id, taskId));

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false, error: 'Failed to delete task' };
  }
}

/**
 * Get all tasks for a user
 */
export async function getTasks(): Promise<{
  success: boolean;
  tasks?: Array<{
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | null;
    dueDate: Date | null;
    completedAt: Date | null;
    createdAt: Date;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const userTasks = await db.query.tasks.findMany({
      where: eq(tasks.userId, user.id),
      orderBy: [desc(tasks.createdAt)],
    });

    return { success: true, tasks: userTasks };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { success: false, error: 'Failed to fetch tasks' };
  }
}

/**
 * Get pending tasks count
 * ⚡ OPTIMIZED: Uses count query instead of fetching all records
 */
export async function getPendingTasksCount(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // ⚡ Use SQL COUNT instead of fetching all records
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, user.id),
          eq(tasks.completed, false),
          or(eq(tasks.status, 'pending'), eq(tasks.status, 'in_progress'))
        )
      );

    return { success: true, count: result[0]?.count || 0 };
  } catch (error) {
    console.error('Error fetching pending tasks count:', error);
    return { success: false, error: 'Failed to fetch count' };
  }
}

/**
 * Toggle task completion
 */
export async function toggleTaskCompletion(taskId: string): Promise<{
  success: boolean;
  completed?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get current task
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.userId !== user.id) {
      return { success: false, error: 'Task not found' };
    }

    const newCompleted = !task.completed;

    await db
      .update(tasks)
      .set({
        completed: newCompleted,
        status: newCompleted ? 'completed' : 'pending',
        completedAt: newCompleted ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    revalidatePath('/dashboard');
    return { success: true, completed: newCompleted };
  } catch (error) {
    console.error('Error toggling task completion:', error);
    return { success: false, error: 'Failed to toggle task' };
  }
}
