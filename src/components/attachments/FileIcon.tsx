'use client';

import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  File,
  FileType,
  Mail,
  Database,
  Presentation,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  contentType: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FileIcon({
  contentType,
  className,
  size = 'md',
}: FileIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const getIconAndColor = (type: string) => {
    // Images
    if (type.startsWith('image/')) {
      return {
        icon: FileImage,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      };
    }

    // Videos
    if (type.startsWith('video/')) {
      return {
        icon: FileVideo,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
      };
    }

    // Audio
    if (type.startsWith('audio/')) {
      return {
        icon: FileAudio,
        color: 'text-pink-500',
        bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      };
    }

    // PDFs
    if (type === 'application/pdf') {
      return {
        icon: FileText,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
      };
    }

    // Word Documents
    if (
      type.includes('word') ||
      type.includes('document') ||
      type.includes('msword')
    ) {
      return {
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      };
    }

    // Excel/Spreadsheets
    if (
      type.includes('spreadsheet') ||
      type.includes('excel') ||
      type.includes('csv')
    ) {
      return {
        icon: FileSpreadsheet,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
      };
    }

    // PowerPoint/Presentations
    if (type.includes('presentation') || type.includes('powerpoint')) {
      return {
        icon: Presentation,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      };
    }

    // Archives
    if (
      type.includes('zip') ||
      type.includes('rar') ||
      type.includes('7z') ||
      type.includes('tar') ||
      type.includes('gz')
    ) {
      return {
        icon: FileArchive,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      };
    }

    // Code
    if (
      type.includes('javascript') ||
      type.includes('typescript') ||
      type.includes('json') ||
      type.includes('xml') ||
      type.includes('html') ||
      type.includes('css') ||
      type.startsWith('text/x-')
    ) {
      return {
        icon: FileCode,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
      };
    }

    // Database
    if (type.includes('database') || type.includes('sql')) {
      return {
        icon: Database,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      };
    }

    // Email
    if (type.includes('eml') || type.includes('msg')) {
      return {
        icon: Mail,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      };
    }

    // Text
    if (type.startsWith('text/')) {
      return {
        icon: FileType,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-700',
      };
    }

    // Default
    return {
      icon: File,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-700',
    };
  };

  const { icon: Icon, color, bgColor } = getIconAndColor(contentType);

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2',
        bgColor,
        className
      )}
    >
      <Icon className={cn(sizeClasses[size], color)} />
    </div>
  );
}

export function getFileCategory(contentType: string): string {
  if (contentType.startsWith('image/')) return 'Images';
  if (contentType.startsWith('video/')) return 'Videos';
  if (contentType.startsWith('audio/')) return 'Audio';
  if (contentType === 'application/pdf') return 'PDFs';
  if (contentType.includes('word') || contentType.includes('document'))
    return 'Documents';
  if (contentType.includes('spreadsheet') || contentType.includes('excel'))
    return 'Spreadsheets';
  if (contentType.includes('presentation')) return 'Presentations';
  if (contentType.includes('zip') || contentType.includes('rar'))
    return 'Archives';
  if (contentType.includes('code') || contentType.startsWith('text/x-'))
    return 'Code';
  if (contentType.startsWith('text/')) return 'Text';
  return 'Other';
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}
