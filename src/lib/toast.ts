/**
 * Toast notification utilities
 * Using Sonner for beautiful toast notifications + Notification Center integration
 */

import { toast as sonnerToast } from 'sonner';
import { createNotification } from './notifications/actions';
import type {
  NotificationType,
  NotificationCategory,
} from '@/db/schema';

/**
 * Helper to add toast to notification center
 */
async function addToNotificationCenter(
  type: NotificationType,
  category: NotificationCategory,
  title: string,
  message?: string,
  options?: {
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await createNotification({
      type,
      category,
      title,
      message,
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
      metadata: options?.metadata,
    });
  } catch (error) {
    // Silently fail - notification center is supplementary
    console.error('Failed to add notification to center:', error);
  }
}

export const toast = {
  success: (
    message: string,
    options?: {
      category?: NotificationCategory;
      actionUrl?: string;
      actionLabel?: string;
      persist?: boolean;
    }
  ) => {
    sonnerToast.success(message, {
      duration: options?.persist ? Infinity : 3000,
    });
    
    // Add to notification center
    if (options?.persist !== false) {
      addToNotificationCenter(
        'success',
        options?.category || 'system',
        message,
        undefined,
        {
          actionUrl: options?.actionUrl,
          actionLabel: options?.actionLabel,
        }
      );
    }
  },

  error: (
    message: string,
    options?: {
      category?: NotificationCategory;
      actionUrl?: string;
      actionLabel?: string;
      persist?: boolean;
    }
  ) => {
    sonnerToast.error(message, {
      duration: options?.persist ? Infinity : 4000,
    });
    
    // Always add errors to notification center
    addToNotificationCenter(
      'error',
      options?.category || 'system',
      message,
      undefined,
      {
        actionUrl: options?.actionUrl,
        actionLabel: options?.actionLabel,
      }
    );
  },

  info: (
    message: string,
    options?: {
      category?: NotificationCategory;
      actionUrl?: string;
      actionLabel?: string;
      persist?: boolean;
    }
  ) => {
    sonnerToast.info(message, {
      duration: options?.persist ? Infinity : 3000,
    });
    
    if (options?.persist !== false) {
      addToNotificationCenter(
        'info',
        options?.category || 'system',
        message,
        undefined,
        {
          actionUrl: options?.actionUrl,
          actionLabel: options?.actionLabel,
        }
      );
    }
  },

  warning: (
    message: string,
    options?: {
      category?: NotificationCategory;
      actionUrl?: string;
      actionLabel?: string;
      persist?: boolean;
    }
  ) => {
    sonnerToast.warning(message, {
      duration: options?.persist ? Infinity : 4000,
    });
    
    // Always add warnings to notification center
    addToNotificationCenter(
      'warning',
      options?.category || 'system',
      message,
      undefined,
      {
        actionUrl: options?.actionUrl,
        actionLabel: options?.actionLabel,
      }
    );
  },

  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
    options?: {
      category?: NotificationCategory;
      persistSuccess?: boolean;
      persistError?: boolean;
    }
  ) => {
    return sonnerToast.promise(promise, messages).then(
      (data) => {
        // Add success to notification center
        const successMsg =
          typeof messages.success === 'function'
            ? messages.success(data)
            : messages.success;
        
        if (options?.persistSuccess !== false) {
          addToNotificationCenter(
            'success',
            options?.category || 'system',
            successMsg
          );
        }
        return data;
      },
      (error) => {
        // Add error to notification center
        const errorMsg =
          typeof messages.error === 'function'
            ? messages.error(error)
            : messages.error;
        
        addToNotificationCenter(
          'error',
          options?.category || 'system',
          errorMsg
        );
        throw error;
      }
    );
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

/**
 * Show a confirmation dialog using a toast
 * Returns a promise that resolves to true if confirmed, false if cancelled
 */
export function confirmDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    sonnerToast(message, {
      duration: 10000,
      action: {
        label: 'Confirm',
        onClick: () => resolve(true),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => resolve(false),
      },
      onDismiss: () => resolve(false),
      onAutoClose: () => resolve(false),
    });
  });
}

