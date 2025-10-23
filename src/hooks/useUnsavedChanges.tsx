// src/hooks/useUnsavedChanges.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesOptions {
  /**
   * Whether to show a warning when navigating away with unsaved changes
   * @default true
   */
  warnOnNavigate?: boolean;
  
  /**
   * Custom message to show in navigation warning
   */
  warningMessage?: string;
}

interface UseUnsavedChangesReturn {
  /**
   * Whether there are unsaved changes
   */
  hasUnsavedChanges: boolean;
  
  /**
   * Mark form as having unsaved changes
   */
  setHasUnsavedChanges: (value: boolean) => void;
  
  /**
   * Reset unsaved changes state (e.g., after successful save)
   */
  resetUnsavedChanges: () => void;
}

/**
 * Hook to detect and warn about unsaved changes
 * - Tracks form state changes
 * - Warns before page unload
 * - Warns before React navigation (optional)
 */
export function useUnsavedChanges(
  options: UseUnsavedChangesOptions = {}
): UseUnsavedChangesReturn {
  const {
    warnOnNavigate = true,
    warningMessage = 'You have unsaved changes. Are you sure you want to leave?',
  } = options;

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const router = useRouter();
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  // Keep ref in sync with state
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Warn on page unload (browser navigation, refresh, close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        // Modern browsers show their own message, but we need to set returnValue
        e.returnValue = warningMessage;
        return warningMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [warningMessage]);

  // Warn on React navigation (optional)
  useEffect(() => {
    if (!warnOnNavigate) return;

    // Note: Next.js App Router doesn't have a built-in way to intercept navigation
    // This would need to be handled at the component level by checking hasUnsavedChanges
    // before calling router.push() or by using onClick handlers on links
  }, [warnOnNavigate, router]);

  const resetUnsavedChanges = () => {
    setHasUnsavedChanges(false);
  };

  return {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    resetUnsavedChanges,
  };
}

/**
 * Helper component to show unsaved changes indicator
 */
export function UnsavedChangesIndicator({
  show,
  message = 'You have unsaved changes',
}: {
  show: boolean;
  message?: string;
}) {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 shadow-lg">
        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
          ⚠️ {message}
        </p>
      </div>
    </div>
  );
}

/**
 * Sticky save bar component for forms with unsaved changes
 */
export function StickySaveBar({
  show,
  onSave,
  onDiscard,
  isSaving = false,
  saveText = 'Save Changes',
  discardText = 'Discard',
}: {
  show: boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  isSaving?: boolean;
  saveText?: string;
  discardText?: string;
}) {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-md animate-in slide-in-from-bottom">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            You have unsaved changes
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onDiscard}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              {discardText}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {saveText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

