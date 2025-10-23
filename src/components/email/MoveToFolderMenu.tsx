'use client';

import { useState, useEffect } from 'react';
import { Folder, FolderPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CustomFolder } from '@/db/schema';
import { toast } from 'sonner';

interface MoveToFolderMenuProps {
  emailId: string;
  currentFolderId?: string | null;
  onClose?: () => void;
  onMoved?: () => void;
}

export function MoveToFolderMenu({
  emailId,
  currentFolderId,
  onClose,
  onMoved,
}: MoveToFolderMenuProps): JSX.Element {
  const [folders, setFolders] = useState<CustomFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    const fetchFolders = async (): Promise<void> => {
      try {
        const response = await fetch('/api/folders');
        if (!response.ok) throw new Error('Failed to fetch folders');

        const data = await response.json();
        setFolders(data.folders || []);
      } catch (error) {
        console.error('Error fetching folders:', error);
        toast.error('Failed to load folders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolders();
  }, []);

  const moveToFolder = async (folderId: string | null): Promise<void> => {
    try {
      setIsMoving(true);

      const response = await fetch('/api/email/move-to-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, folderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move email');
      }

      toast.success(
        folderId
          ? 'Email moved to folder successfully'
          : 'Email removed from folder'
      );

      onMoved?.();
      onClose?.();
    } catch (error) {
      console.error('Error moving email:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to move email'
      );
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div className="w-64 rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200/80 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-gray-700 dark:text-white/70" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Move to Folder
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-white/50 dark:hover:text-white/70 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Folder List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center">
            <div className="text-sm text-gray-500 dark:text-white/50">
              Loading folders...
            </div>
          </div>
        ) : folders.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FolderPlus className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-white/30" />
            <div className="text-sm text-gray-500 dark:text-white/50 mb-1">
              No custom folders yet
            </div>
            <div className="text-xs text-gray-400 dark:text-white/40">
              Create folders in settings
            </div>
          </div>
        ) : (
          <div className="py-1">
            {/* Remove from folder option */}
            {currentFolderId && (
              <>
                <button
                  type="button"
                  onClick={() => moveToFolder(null)}
                  disabled={isMoving}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-white/5',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center gap-3'
                  )}
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-white/50" />
                  <span className="text-gray-700 dark:text-white/70">
                    Remove from folder
                  </span>
                </button>
                <div className="h-px bg-gray-200 dark:bg-white/10 my-1" />
              </>
            )}

            {/* Folder options */}
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => moveToFolder(folder.id)}
                disabled={isMoving || folder.id === currentFolderId}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-sm transition-colors',
                  'hover:bg-gray-50 dark:hover:bg-white/5',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center gap-3',
                  folder.id === currentFolderId &&
                    'bg-primary/5 dark:bg-primary/10'
                )}
              >
                <span className="text-lg">{folder.icon}</span>
                <span
                  className={cn(
                    'flex-1 text-gray-700 dark:text-white/70',
                    folder.id === currentFolderId && 'font-medium'
                  )}
                >
                  {folder.name}
                </span>
                {folder.id === currentFolderId && (
                  <span className="text-xs text-primary dark:text-primary-300">
                    Current
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

