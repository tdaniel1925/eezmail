'use client';

import { AttachmentItem, type Attachment } from './AttachmentItem';
import { AlertCircle } from 'lucide-react';

// Re-export Attachment type for convenience
export type { Attachment };

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
  maxSize?: number; // in bytes, default 25MB
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export function AttachmentList({
  attachments,
  onRemove,
  maxSize = 25 * 1024 * 1024, // 25MB default
}: AttachmentListProps) {
  if (attachments.length === 0) {
    return null;
  }

  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
  const isOverLimit = totalSize > maxSize;

  return (
    <div className="space-y-3">
      {/* Warning Banner */}
      {isOverLimit && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Total attachment size exceeds limit
            </p>
            <p className="mt-1 text-yellow-700 dark:text-yellow-300">
              Total: {formatFileSize(totalSize)} / Max:{' '}
              {formatFileSize(maxSize)}
            </p>
          </div>
        </div>
      )}

      {/* Total Size Indicator */}
      {!isOverLimit && attachments.length > 1 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {attachments.length} file{attachments.length > 1 ? 's' : ''} •{' '}
          {formatFileSize(totalSize)} total
        </div>
      )}

      {/* Attachments Grid */}
      <div className="grid gap-2 sm:grid-cols-2">
        {attachments.map((attachment) => (
          <AttachmentItem
            key={attachment.id}
            attachment={attachment}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
