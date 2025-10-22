'use client';

import { format } from 'date-fns';
import {
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  FileCode,
  Film,
  Music,
  Archive as ArchiveIcon,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmailAttachment } from '@/db/schema';
import { getFileTypeLabel } from '@/lib/attachments/filter';

interface AttachmentListViewProps {
  attachments: EmailAttachment[];
  onDownload: (att: EmailAttachment) => void;
  onDelete: (att: EmailAttachment) => void;
  isGeneratingDescriptions?: boolean;
}

// Get icon for file type
function getFileIcon(contentType: string) {
  const type = contentType.toLowerCase();
  
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type === 'application/pdf') return FileText;
  if (type.includes('word') || type.includes('document')) return FileText;
  if (type.includes('excel') || type.includes('spreadsheet')) return FileSpreadsheet;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('7z')) return ArchiveIcon;
  if (type.includes('json') || type.includes('xml') || type.startsWith('text/')) return FileCode;
  
  return File;
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function AttachmentListView({
  attachments,
  onDownload,
  onDelete,
  isGeneratingDescriptions = false,
}: AttachmentListViewProps) {
  if (attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No attachments found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Attachments from your emails will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Table Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-1">Date</div>
          <div className="col-span-2">Filename</div>
          <div className="col-span-2">From</div>
          <div className="col-span-2">File Type</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {attachments.map((attachment, index) => {
          const Icon = getFileIcon(attachment.contentType);
          const typeLabel = getFileTypeLabel(attachment.contentType);
          const date = new Date(attachment.createdAt);
          
          return (
            <div
              key={attachment.id}
              className={cn(
                'grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                index % 2 === 1 && 'bg-gray-50/50 dark:bg-gray-800/50'
              )}
            >
              {/* Date & Time */}
              <div className="col-span-1 flex flex-col justify-center">
                <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {format(date, 'MMM dd')}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(date, 'h:mm a')}
                </span>
              </div>

              {/* Filename */}
              <div className="col-span-2 flex items-center min-w-0">
                <span
                  className="text-sm text-gray-900 dark:text-gray-100 truncate"
                  title={attachment.filename}
                >
                  {attachment.filename}
                </span>
              </div>

              {/* From - Extract from email relationship */}
              <div className="col-span-2 flex items-center min-w-0">
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {(attachment as any).email?.fromAddress?.name || 
                   (attachment as any).email?.fromAddress?.email || 
                   'Unknown'}
                </span>
              </div>

              {/* File Type & Size */}
              <div className="col-span-2 flex items-center gap-2">
                <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {typeLabel}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.size)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="col-span-4 flex items-center min-w-0">
                {attachment.aiDescription ? (
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {attachment.aiDescription}
                  </span>
                ) : isGeneratingDescriptions ? (
                  <span className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="text-sm text-gray-400 italic">
                    No description
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end gap-2">
                <button
                  onClick={() => onDownload(attachment)}
                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(attachment)}
                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

