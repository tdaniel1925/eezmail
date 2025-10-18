'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Download,
  Trash2,
  FileText,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import type { EmailAttachment } from '@/db/schema';
import { cn } from '@/lib/utils';

interface AttachmentPreviewModalProps {
  attachment: EmailAttachment | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function AttachmentPreviewModal({
  attachment,
  isOpen,
  onClose,
  onDownload,
  onDelete,
}: AttachmentPreviewModalProps): JSX.Element | null {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen && attachment) {
      // Reset image error state for new attachment
      setImageError(false);
      // Generate AI summary when attachment is opened
      generateAISummary();
    } else {
      // Reset state when closed
      setAiSummary(null);
      setIsLoadingSummary(false);
      setSummaryError(null);
      setImageError(false);
    }
  }, [isOpen, attachment?.id]);

  const generateAISummary = async (): Promise<void> => {
    if (!attachment) return;

    setIsLoadingSummary(true);
    setSummaryError(null);

    try {
      const response = await fetch('/api/ai/attachment-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachmentId: attachment.id,
          filename: attachment.filename,
          contentType: attachment.contentType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setAiSummary(data.summary || 'No summary available');
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setSummaryError('Unable to generate AI summary');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const canPreview = (contentType: string): boolean => {
    return (
      contentType.startsWith('image/') ||
      contentType === 'application/pdf' ||
      contentType.startsWith('text/')
    );
  };

  if (!isOpen || !attachment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-hidden">
      <div className="relative flex flex-col w-full max-w-4xl h-[90vh] rounded-lg bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900 flex-shrink-0">
          <div className="flex-1 pr-4">
            <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
              {attachment.filename}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(attachment.size)} •{' '}
              {format(new Date(attachment.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Preview Panel */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-950">
            {canPreview(attachment.contentType) ? (
              <div className="flex items-center justify-center">
                {attachment.contentType.startsWith('image/') &&
                attachment.storageUrl &&
                !imageError ? (
                  <img
                    src={attachment.storageUrl}
                    alt={attachment.filename}
                    className="max-h-full max-w-full rounded-lg shadow-md"
                    onError={() => setImageError(true)}
                  />
                ) : attachment.contentType.startsWith('image/') &&
                  imageError ? (
                  <div className="flex flex-col items-center justify-center space-y-4 p-8">
                    <AlertCircle className="h-16 w-16 text-red-400 dark:text-red-500" />
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Image Unavailable
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        The image could not be loaded. It may have been moved or
                        deleted.
                      </p>
                    </div>
                    <button
                      onClick={onDownload}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                    >
                      <Download className="h-4 w-4" />
                      Download File
                    </button>
                  </div>
                ) : attachment.contentType.startsWith('image/') &&
                  !attachment.storageUrl ? (
                  <div className="flex flex-col items-center justify-center space-y-4 p-8">
                    <ImageIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        No Preview Available
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This image cannot be previewed.
                      </p>
                    </div>
                  </div>
                ) : null}
                {attachment.contentType === 'application/pdf' &&
                  attachment.storageUrl && (
                    <iframe
                      src={attachment.storageUrl}
                      className="h-[600px] w-full rounded-lg border-2 border-gray-200 dark:border-gray-700"
                      title={attachment.filename}
                    />
                  )}
                {attachment.contentType.startsWith('text/') && (
                  <div className="w-full rounded-lg border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Text file preview coming soon
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <FileText className="h-20 w-20 text-gray-300 dark:text-gray-600" />
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Preview not available for this file type
                </p>
                <button
                  onClick={onDownload}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Download to view
                </button>
              </div>
            )}
          </div>

          {/* AI Summary Sidebar */}
          <div className="w-80 border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="h-full overflow-y-auto p-4">
              {/* AI Summary Section */}
              <div className="mb-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    AI Summary
                  </h3>
                </div>

                {isLoadingSummary ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : summaryError ? (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {summaryError}
                  </div>
                ) : aiSummary ? (
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-gray-700 dark:bg-blue-900/20 dark:text-gray-300">
                    {aiSummary}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No summary available
                  </div>
                )}
              </div>

              {/* File Details */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  File Details
                </h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Type</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">
                      {attachment.contentType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Size</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">
                      {formatFileSize(attachment.size)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">
                      Downloads
                    </dt>
                    <dd className="font-medium text-gray-900 dark:text-white">
                      {attachment.downloadCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Added</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(attachment.createdAt), 'MMM d, yyyy')}
                    </dd>
                  </div>
                  {attachment.lastDownloadedAt && (
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Last Downloaded
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {format(
                          new Date(attachment.lastDownloadedAt),
                          'MMM d, yyyy'
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Actions */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={onDownload}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Download File
                </button>
                {attachment.storageUrl && (
                  <a
                    href={attachment.storageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
