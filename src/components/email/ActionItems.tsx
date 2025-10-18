'use client';

import { useState, useEffect } from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActionItem {
  id: string;
  description: string;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isCompleted: boolean;
}

interface ActionItemsProps {
  emailId: string;
  subject: string;
  bodyText: string;
}

export function ActionItems({
  emailId,
  subject,
  bodyText,
}: ActionItemsProps): JSX.Element {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract action items on component mount
  useEffect(() => {
    extractActions();
  }, [emailId]);

  const extractActions = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/extract-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId,
          subject,
          bodyText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract actions');
      }

      const data = await response.json();

      if (data.success && data.actions) {
        setActions(data.actions);
        if (data.actions.length > 0) {
          setIsExpanded(true);
        }
      }
    } catch (error) {
      console.error('Error extracting actions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplete = async (actionId: string): Promise<void> => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === actionId
          ? { ...action, isCompleted: !action.isCompleted }
          : action
      )
    );

    toast.success('Action item updated');
  };

  const getPriorityColor = (
    priority: ActionItem['priority']
  ): { bg: string; text: string; border: string } => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-red-100 dark:bg-red-500/20',
          text: 'text-red-700 dark:text-red-400',
          border: 'border-red-300 dark:border-red-500/30',
        };
      case 'high':
        return {
          bg: 'bg-orange-100 dark:bg-orange-500/20',
          text: 'text-orange-700 dark:text-orange-400',
          border: 'border-orange-300 dark:border-orange-500/30',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-500/20',
          text: 'text-yellow-700 dark:text-yellow-400',
          border: 'border-yellow-300 dark:border-yellow-500/30',
        };
      case 'low':
        return {
          bg: 'bg-gray-100 dark:bg-gray-500/20',
          text: 'text-gray-700 dark:text-gray-400',
          border: 'border-gray-300 dark:border-gray-500/30',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-500/20',
          text: 'text-gray-700 dark:text-gray-400',
          border: 'border-gray-300 dark:border-gray-500/30',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Extracting action items...</span>
        </div>
      </div>
    );
  }

  if (actions.length === 0) {
    return <></>;
  }

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            {actions.length} Action Item{actions.length !== 1 ? 's' : ''} Found
          </h3>
        </div>
        <span className="text-xs text-blue-600 dark:text-blue-400">
          {isExpanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {actions.map((action) => {
            const colors = getPriorityColor(action.priority);
            return (
              <div
                key={action.id}
                className={cn(
                  'flex items-start gap-3 rounded-md border p-3 transition-all',
                  colors.bg,
                  colors.border,
                  action.isCompleted && 'opacity-50'
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleComplete(action.id)}
                  className={cn(
                    'mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 transition-all',
                    action.isCompleted
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-green-500'
                  )}
                >
                  {action.isCompleted && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </button>

                <div className="flex-1">
                  <p
                    className={cn(
                      'text-sm',
                      colors.text,
                      action.isCompleted && 'line-through'
                    )}
                  >
                    {action.description}
                  </p>
                  {action.dueDate && (
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>
                        Due: {new Date(action.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <span
                  className={cn('text-xs font-medium uppercase', colors.text)}
                >
                  {action.priority}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



