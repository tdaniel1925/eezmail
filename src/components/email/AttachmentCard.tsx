'use client';

import { Download, FileText, Image, File, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { EmailAttachment } from '@/db/schema';

interface AttachmentCardProps {
  attachment: EmailAttachment;
  showPreview?: boolean;
}

export function AttachmentCard({ attachment, showPreview = false }: AttachmentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileIcon = () => {
    const type = attachment.contentType;
    if (type.startsWith('image/')) return Image;
    if (type === 'application/pdf' || type.includes('word') || type.includes('document'))
      return FileText;
    return File;
  };

  const Icon = getFileIcon();
  const isImage = attachment.contentType.startsWith('image/');

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/attachments/${attachment.id}/download`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.originalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${attachment.originalFilename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download attachment');
    } finally {
      setIsDownloading(false);
    }
  };

  // For images, show inline preview if available
  const showInlinePreview = showPreview && isImage && attachment.storageUrl;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors">
      {showInlinePreview ? (
        <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={attachment.storageUrl}
            alt={attachment.originalFilename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {attachment.originalFilename}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(attachment.size)}
          </p>
          {attachment.downloadStatus === 'completed' && (
            <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-medium rounded">
              Downloaded
            </span>
          )}
          {attachment.downloadStatus === 'pending' && (
            <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-medium rounded">
              Pending
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={cn(
          "flex-shrink-0 p-2 rounded-lg transition-colors",
          isDownloading
            ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        )}
        title="Download"
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        ) : (
          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </div>
  );
}

