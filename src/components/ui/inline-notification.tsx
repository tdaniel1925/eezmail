/**
 * Inline Notification Component
 * Displays success/error/info messages inline with sections
 */

import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InlineNotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export function InlineNotification({
  type,
  message,
  onClose,
  className,
}: InlineNotificationProps): JSX.Element {
  const config = {
    success: {
      bgColor:
        'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-300',
      icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
    },
    error: {
      bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-300',
      icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    },
    warning: {
      bgColor:
        'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-300',
      icon: <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
    },
    info: {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-300',
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
  };

  const { bgColor, textColor, icon } = config[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        bgColor,
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <p className={cn('text-sm font-medium', textColor)}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 rounded-md p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10',
            textColor
          )}
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

