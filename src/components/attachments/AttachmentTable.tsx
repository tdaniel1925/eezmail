'use client';

import {
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  Archive as ArchiveIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import type { EmailAttachment } from '@/db/schema';

interface AttachmentTableProps {
  attachments: EmailAttachment[];
  onAttachmentClick: (attachment: EmailAttachment) => void;
  onDownload: (attachment: EmailAttachment) => void;
  onDelete: (attachment: EmailAttachment) => void;
}

export function AttachmentTable({
  attachments,
  onAttachmentClick,
  onDownload,
  onDelete,
}: AttachmentTableProps): JSX.Element {
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

  const getFileType = (contentType: string): string => {
    if (contentType.startsWith('image/')) return 'Image';
    if (contentType.includes('pdf')) return 'PDF';
    if (contentType.includes('word') || contentType.includes('document'))
      return 'Document';
    if (contentType.includes('spreadsheet') || contentType.includes('excel'))
      return 'Spreadsheet';
    if (contentType.includes('zip') || contentType.includes('rar'))
      return 'Archive';
    if (contentType.includes('video/')) return 'Video';
    if (contentType.includes('audio/')) return 'Audio';
    return 'File';
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Size
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Downloads
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {attachments.map((attachment) => {
            const Icon = getFileIcon(attachment.contentType);
            const fileType = getFileType(attachment.contentType);

            return (
              <tr
                key={attachment.id}
                className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                {/* Name */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => onAttachmentClick(attachment)}
                    className="flex items-center gap-3 text-left"
                  >
                    <Icon className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    <span className="truncate text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                      {attachment.filename}
                    </span>
                  </button>
                </td>

                {/* Type */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {fileType}
                  </span>
                </td>

                {/* Size */}
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatFileSize(attachment.size)}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(attachment.createdAt), 'MMM d, yyyy')}
                  </span>
                </td>

                {/* Downloads */}
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {attachment.downloadCount}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(attachment);
                      }}
                      className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(attachment);
                      }}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
