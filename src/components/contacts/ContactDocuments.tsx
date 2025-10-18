'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  emailSubject: string;
  emailDate: Date;
  emailId: string;
  contentType: string;
  downloadUrl?: string;
}

interface ContactDocumentsProps {
  contactId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function ContactDocuments({
  contactId,
}: ContactDocumentsProps): JSX.Element {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load documents from API
  useEffect(() => {
    loadDocuments();
  }, [contactId]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/documents`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      if (data.success && data.documents) {
        setDocuments(
          data.documents.map((doc: any) => ({
            ...doc,
            emailDate: new Date(doc.emailDate),
          }))
        );
      } else {
        toast.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.emailSubject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'No documents found matching your search'
              : 'No documents found from emails with this contact'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary/50 dark:hover:border-primary/50 transition-colors"
            >
              {/* File Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {doc.fileName}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  From: {doc.emailSubject}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(doc.fileSize)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {doc.emailDate.toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {doc.downloadUrl && (
                  <a
                    href={doc.downloadUrl}
                    download={doc.fileName}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => {
                    // TODO: Navigate to email
                    window.location.href = `/dashboard/emails/${doc.emailId}`;
                  }}
                  className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
                  title="View email"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!searchQuery && documents.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
          Total: {documents.length} document{documents.length !== 1 ? 's' : ''}{' '}
          (
          {formatFileSize(
            documents.reduce((sum, doc) => sum + doc.fileSize, 0)
          )}
          )
        </div>
      )}
    </div>
  );
}
