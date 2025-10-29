import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InlineMessageType = 'success' | 'error' | 'info' | 'warning';

interface InlineMessageProps {
  type: InlineMessageType;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function InlineMessage({
  type,
  message,
  onDismiss,
  className,
}: InlineMessageProps): JSX.Element {
  const styles = {
    success:
      'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    error:
      'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    info: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    warning:
      'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'rounded-lg border p-4 flex items-start justify-between gap-3',
        styles[type],
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span className="text-sm">{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
