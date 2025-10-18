'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  Trash2,
  Edit2,
  AlertCircle,
  Clock,
  CheckSquare,
  Filter,
} from 'lucide-react';
import { getTasks, createTask, updateTask, deleteTask, toggleTaskCompletion } from '@/lib/tasks/actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | null;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

interface TasksViewProps {
  accounts: any[];
}

type FilterType = 'all' | 'pending' | 'completed' | 'overdue';

export function TasksView({ accounts }: TasksViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    const result = await getTasks();
    if (result.success && result.tasks) {
      setTasks(result.tasks);
    }
    setIsLoading(false);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    const result = await createTask({
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      priority: newTaskPriority,
      dueDate: newTaskDueDate ? new Date(newTaskDueDate) : undefined,
    });

    if (result.success) {
      toast.success('Task created');
      setShowCreateModal(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
      fetchTasks();
    } else {
      toast.error(result.error || 'Failed to create task');
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    const result = await toggleTaskCompletion(taskId);
    if (result.success) {
      fetchTasks();
    } else {
      toast.error(result.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const result = await deleteTask(taskId);
    if (result.success) {
      toast.success('Task deleted');
      fetchTasks();
    } else {
      toast.error(result.error || 'Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    if (filter === 'overdue') {
      return (
        !task.completed &&
        task.dueDate &&
        new Date(task.dueDate) < new Date()
      );
    }
    return true;
  });

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const isOverdue = (task: Task) => {
    return (
      !task.completed &&
      task.dueDate &&
      new Date(task.dueDate) < new Date()
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <CheckSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Tasks
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tasks.length} total • {tasks.filter((t) => !t.completed).length} pending
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex space-x-2">
          {(['all', 'pending', 'completed', 'overdue'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading tasks...</div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No tasks found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-primary hover:underline"
            >
              Create your first task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'flex items-start space-x-4 rounded-lg border bg-white p-4 shadow-sm transition-all dark:bg-gray-800',
                  task.completed
                    ? 'border-gray-200 dark:border-gray-700 opacity-60'
                    : 'border-gray-200 dark:border-gray-700 hover:shadow-md',
                  isOverdue(task) && 'border-l-4 border-l-red-500'
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleComplete(task.id)}
                  className="mt-0.5 flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-400 hover:text-primary transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'font-semibold text-gray-900 dark:text-white',
                      task.completed && 'line-through text-gray-500'
                    )}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {task.priority && (
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-medium rounded',
                          getPriorityColor(task.priority)
                        )}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                    )}
                    {task.dueDate && (
                      <span
                        className={cn(
                          'flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded',
                          isOverdue(task)
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </span>
                    )}
                    {isOverdue(task) && (
                      <span className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        <span>Overdue</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Task
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Task description"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




