'use client';

import { useState } from 'react';
import {
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  Archive as ArchiveIcon,
  MoreVertical,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { EmailAttachment } from '@/db/schema';

interface AttachmentGridProps {
  attachments: EmailAttachment[];
  onAttachmentClick: (attachment: EmailAttachment) => void;
  onDownload: (attachment: EmailAttachment) => void;
  onDelete: (attachment: EmailAttachment) => void;
}

export function AttachmentGrid({
  attachments,
  onAttachmentClick,
  onDownload,
  onDelete,
}: AttachmentGridProps): JSX.Element {
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return ImageIcon;
    if (contentType.includes('pdf')) return FileText;
    if (contentType.includes('spreadsheet') || contentType.includes('excel'))
      return FileSpreadsheet;
    if (contentType.includes('zip') || contentType.includes('rar'))
      return ArchiveIcon;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleImageError = (attachmentId: string) => {
    setBrokenImages((prev) => new Set(prev).add(attachmentId));
  };

  const getPreviewImage = (attachment: EmailAttachment): string | null => {
    if (attachment.contentType.startsWith('image/') && attachment.storageUrl) {
      return attachment.storageUrl;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {attachments.map((attachment) => {
        const Icon = getFileIcon(attachment.contentType);
        const previewImage = getPreviewImage(attachment);

        return (
          <div
            key={attachment.id}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Preview/Thumbnail */}
            <button
              onClick={() => onAttachmentClick(attachment)}
              className="flex h-40 w-full items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900"
            >
              {previewImage && !brokenImages.has(attachment.id) ? (
                <img
                  src={previewImage}
                  alt={attachment.filename}
                  className="h-full w-full object-cover"
                  onError={() => handleImageError(attachment.id)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  {brokenImages.has(attachment.id) ? (
                    <AlertCircle className="h-12 w-12 text-red-400 dark:text-red-500" />
                  ) : (
                    <Icon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                  )}
                  {brokenImages.has(attachment.id) && (
                    <span className="text-xs text-red-500 dark:text-red-400">
                      Image unavailable
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* File Info */}
            <div className="flex flex-1 flex-col p-3">
              <button
                onClick={() => onAttachmentClick(attachment)}
                className="mb-1 truncate text-left text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                title={attachment.filename}
              >
                {attachment.filename}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(attachment.size)}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {format(new Date(attachment.createdAt), 'MMM d, yyyy')}
              </p>
            </div>

            {/* Actions */}
            <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(attachment);
                }}
                className="rounded-lg bg-white/90 p-1.5 text-gray-600 shadow-sm hover:bg-white hover:text-gray-900 dark:bg-gray-800/90 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(attachment);
                }}
                className="rounded-lg bg-white/90 p-1.5 text-red-600 shadow-sm hover:bg-white hover:text-red-700 dark:bg-gray-800/90 dark:text-red-400 dark:hover:bg-gray-800 dark:hover:text-red-300"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Download Count Badge */}
            {attachment.downloadCount > 0 && (
              <div className="absolute bottom-2 left-2">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {attachment.downloadCount} downloads
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
