'use client';

import {
  X,
  FileText,
  File,
  Image as ImageIcon,
  FileArchive,
  FileVideo,
  FileAudio,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data?: string; // Base64 data
  progress?: number; // Upload progress 0-100
  error?: string;
}

interface AttachmentItemProps {
  attachment: Attachment;
  onRemove: (id: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('audio/')) return FileAudio;
  if (
    type.includes('pdf') ||
    type.includes('document') ||
    type.includes('text')
  )
    return FileText;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar'))
    return FileArchive;
  return File;
};

const getFileColor = (type: string): string => {
  if (type.startsWith('image/')) return 'text-blue-500';
  if (type.startsWith('video/')) return 'text-purple-500';
  if (type.startsWith('audio/')) return 'text-green-500';
  if (type.includes('pdf')) return 'text-red-500';
  if (type.includes('document')) return 'text-blue-600';
  if (type.includes('zip') || type.includes('rar')) return 'text-yellow-600';
  return 'text-gray-500';
};

export function AttachmentItem({ attachment, onRemove }: AttachmentItemProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [imageError, setImageError] = useState(false);
  const FileIcon = getFileIcon(attachment.type);
  const fileColor = getFileColor(attachment.type);
  const isImage = attachment.type.startsWith('image/');
  const isUploading =
    attachment.progress !== undefined && attachment.progress < 100;

  return (
    <div className="group relative flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-primary/50 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* File Icon or Image Preview */}
      <div className="relative">
        {isImage && attachment.data && !imageError ? (
          <div
            className="relative h-12 w-12 cursor-pointer overflow-hidden rounded"
            onClick={() => setShowPreview(!showPreview)}
          >
            <img
              src={`data:${attachment.type};base64,${attachment.data}`}
              alt={attachment.name}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
            {isImage && imageError ? (
              <AlertCircle className="h-6 w-6 text-red-400 dark:text-red-500" />
            ) : (
              <FileIcon className={`h-6 w-6 ${fileColor}`} />
            )}
          </div>
        )}

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded bg-black/50">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {attachment.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatFileSize(attachment.size)}</span>
          {isUploading && (
            <>
              <span>•</span>
              <span>{attachment.progress}%</span>
            </>
          )}
          {attachment.error && (
            <>
              <span>•</span>
              <span className="text-red-500">{attachment.error}</span>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${attachment.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(attachment.id)}
        className="rounded-md p-1 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
        aria-label="Remove attachment"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Image Preview Modal */}
      {showPreview && isImage && attachment.data && !imageError && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={`data:${attachment.type};base64,${attachment.data}`}
              alt={attachment.name}
              className="max-h-[90vh] max-w-full rounded-lg"
              onError={() => setImageError(true)}
            />
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
