'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Trash2,
  FileText,
  Filter,
  SortAsc,
  SortDesc,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttachmentListView } from '@/components/attachments/AttachmentListView';
import { PaginationControls } from '@/components/attachments/PaginationControls';
import { AttachmentPreviewModal } from '@/components/attachments/AttachmentPreviewModal';
import { toast } from 'sonner';
import type { EmailAttachment } from '@/db/schema';
import { generateMissingDescriptions } from '@/lib/attachments/actions';

type SortOption = 'date' | 'name' | 'size' | 'type';
type FilterType =
  | 'all'
  | 'images'
  | 'documents'
  | 'spreadsheets'
  | 'pdfs'
  | 'archives';

export default function AttachmentsPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] =
    useState<EmailAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch attachments
  useEffect(() => {
    fetchAttachments();
  }, [currentPage, itemsPerPage]);

  const fetchAttachments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/attachments?page=${currentPage}&limit=${itemsPerPage}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAttachments(data.attachments || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        console.error('Failed to fetch attachments');
        setAttachments([]);
        toast.error('Failed to load attachments');
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
      setAttachments([]);
      toast.error('Error loading attachments');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI descriptions for attachments without them
  const handleGenerateDescriptions = async () => {
    setIsGeneratingDescriptions(true);
    try {
      const result = await generateMissingDescriptions(20);
      
      if (result.success && result.generated > 0) {
        toast.success(`Generated ${result.generated} descriptions`);
        // Refresh to show new descriptions
        await fetchAttachments();
      } else if (result.generated === 0) {
        toast.info('All attachments already have descriptions');
      } else {
        toast.error('Failed to generate descriptions');
      }
    } catch (error) {
      console.error('Error generating descriptions:', error);
      toast.error('Error generating descriptions');
    } finally {
      setIsGeneratingDescriptions(false);
    }
  };

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

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

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
              {totalItems} files • {formatFileSize(totalSize)}
            </p>
          </div>
        </div>

        {/* Generate Descriptions Button */}
        <button
          onClick={handleGenerateDescriptions}
          disabled={isGeneratingDescriptions}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingDescriptions ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Descriptions
            </>
          )}
        </button>
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
        ) : (
          <AttachmentListView
            attachments={filteredAttachments}
            onDownload={handleDownload}
            onDelete={handleDelete}
            isGeneratingDescriptions={isGeneratingDescriptions}
          />
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredAttachments.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

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
