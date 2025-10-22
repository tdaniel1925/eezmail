'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Grid3x3,
  List,
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
  Filter,
  Calendar,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttachmentGrid } from '@/components/attachments/AttachmentGrid';
import { AttachmentTable } from '@/components/attachments/AttachmentTable';
import { AttachmentPreviewModal } from '@/components/attachments/AttachmentPreviewModal';
import { toast } from 'sonner';
import type { EmailAttachment } from '@/db/schema';

type ViewMode = 'grid' | 'table';
type SortOption = 'date' | 'name' | 'size' | 'type';
type FilterType =
  | 'all'
  | 'images'
  | 'documents'
  | 'spreadsheets'
  | 'pdfs'
  | 'archives';

export default function AttachmentsPage(): JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] =
    useState<EmailAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch real attachments from server
    const fetchAttachments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/attachments');
        if (response.ok) {
          const data = await response.json();
          setAttachments(data.attachments || []);
        } else {
          console.error('Failed to fetch attachments');
          setAttachments([]);
        }
      } catch (error) {
        console.error('Error fetching attachments:', error);
        setAttachments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttachments();
  }, []);

  // Filter and sort attachments
  const filteredAttachments = attachments
    .filter((att) => {
      // Search filter
      if (
        searchQuery &&
        !att.filename.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'images' && !att.contentType.startsWith('image/'))
          return false;
        if (
          filterType === 'documents' &&
          !att.contentType.includes('word') &&
          !att.contentType.includes('document')
        )
          return false;
        if (
          filterType === 'spreadsheets' &&
          !att.contentType.includes('spreadsheet') &&
          !att.contentType.includes('excel')
        )
          return false;
        if (filterType === 'pdfs' && att.contentType !== 'application/pdf')
          return false;
        if (
          filterType === 'archives' &&
          !att.contentType.includes('zip') &&
          !att.contentType.includes('rar')
        )
          return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.contentType.localeCompare(b.contentType);
          break;
      }
      return sortDesc ? -comparison : comparison;
    });

  const handleAttachmentClick = (attachment: EmailAttachment) => {
    setSelectedAttachment(attachment);
    setIsPreviewOpen(true);
    // TODO: Trigger AI summary in sidebar
  };

  const handleDownload = (attachment: EmailAttachment) => {
    toast.success(`Downloading ${attachment.filename}`);
    // TODO: Implement download
  };

  const handleDelete = (attachment: EmailAttachment) => {
    if (confirm(`Are you sure you want to delete ${attachment.filename}?`)) {
      setAttachments(attachments.filter((a) => a.id !== attachment.id));
      toast.success('Attachment deleted');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
  const totalCount = attachments.length;

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="h-16 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
        <div className="flex items-center gap-4">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Attachments
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalCount} files • {formatFileSize(totalSize)}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            )}
            title="Grid view"
          >
            <Grid3x3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'table'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            )}
            title="Table view"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search attachments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All types</option>
              <option value="images">Images</option>
              <option value="documents">Documents</option>
              <option value="spreadsheets">Spreadsheets</option>
              <option value="pdfs">PDFs</option>
              <option value="archives">Archives</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>

            {/* Sort Direction */}
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              title={sortDesc ? 'Descending' : 'Ascending'}
            >
              {sortDesc ? (
                <SortDesc className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <SortAsc className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : filteredAttachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No attachments found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Attachments from your emails will appear here'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <AttachmentGrid
            attachments={filteredAttachments}
            onAttachmentClick={handleAttachmentClick}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        ) : (
          <AttachmentTable
            attachments={filteredAttachments}
            onAttachmentClick={handleAttachmentClick}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Preview Modal */}
      <AttachmentPreviewModal
        attachment={selectedAttachment}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedAttachment(null);
        }}
        onDownload={() =>
          selectedAttachment && handleDownload(selectedAttachment)
        }
        onDelete={() => {
          if (selectedAttachment) {
            handleDelete(selectedAttachment);
            setIsPreviewOpen(false);
            setSelectedAttachment(null);
          }
        }}
      />
    </div>
  );
}
