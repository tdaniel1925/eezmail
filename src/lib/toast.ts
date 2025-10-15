/**
 * Toast notification utilities
 * Using Sonner for beautiful toast notifications
 */

import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message);
  },

  error: (message: string) => {
    sonnerToast.error(message);
  },

  info: (message: string) => {
    sonnerToast.info(message);
  },

  warning: (message: string) => {
    sonnerToast.warning(message);
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
    }
  ) => {
    return sonnerToast.promise(promise, messages);
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


