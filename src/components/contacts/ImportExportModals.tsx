/**
 * Import/Export Modals
 * Upload CSV/vCard files and download contacts
 */

'use client';

import { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import {
  importFromCSV,
  importFromVCard,
  exportToCSV,
  exportToVCard,
} from '@/lib/contacts/import-export';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onImportComplete?: () => void;
}

export function ImportModal({
  isOpen,
  onClose,
  userId,
  onImportComplete,
}: ImportModalProps): JSX.Element | null {
  const [isImporting, setIsImporting] = useState(false);
  const [fileType, setFileType] = useState<'csv' | 'vcard'>('csv');
  const [results, setResults] = useState<{
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setResults(null);

    try {
      const content = await file.text();

      let result;
      if (fileType === 'csv') {
        result = await importFromCSV(userId, content);
      } else {
        result = await importFromVCard(userId, content);
      }

      if (result.success) {
        setResults({
          imported: result.imported,
          failed: result.failed,
          errors: result.errors,
        });

        if (result.imported > 0) {
          toast.success(`Successfully imported ${result.imported} contact(s)`);
          onImportComplete?.();
        }

        if (result.failed > 0) {
          toast.warning(`${result.failed} contact(s) failed to import`);
        }
      } else {
        toast.error('Import failed. Please check the file format.');
        setResults({
          imported: 0,
          failed: 0,
          errors: result.errors || ['Unknown error'],
        });
      }
    } catch (error) {
      toast.error('Failed to read file');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = () => {
    setResults(null);
    setFileType('csv');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload size={24} />
            Import Contacts
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              File Format
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setFileType('csv')}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                  fileType === 'csv'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'
                }`}
              >
                <FileText size={24} className="mx-auto mb-2" />
                <div className="font-medium">CSV</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Comma-separated values
                </div>
              </button>
              <button
                onClick={() => setFileType('vcard')}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                  fileType === 'vcard'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'
                }`}
              >
                <FileText size={24} className="mx-auto mb-2" />
                <div className="font-medium">vCard</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Contact card format
                </div>
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload size={48} className="mb-4 text-gray-400" />
                <p className="mb-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {fileType === 'csv' ? 'CSV file (.csv)' : 'vCard file (.vcf)'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                className="hidden"
                accept={fileType === 'csv' ? '.csv' : '.vcf'}
                onChange={handleFileUpload}
                disabled={isImporting}
              />
            </label>
          </div>

          {/* Loading State */}
          {isImporting && (
            <div className="text-center py-8">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Importing contacts...
              </p>
            </div>
          )}

          {/* Results */}
          {results && !isImporting && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {results.imported > 0 ? (
                  <CheckCircle size={32} className="text-green-600" />
                ) : (
                  <AlertCircle size={32} className="text-red-600" />
                )}
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Import Complete
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {results.imported} imported, {results.failed} failed
                  </div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg">
                  <div className="font-medium text-red-900 dark:text-red-300 mb-2">
                    Errors:
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                    {results.errors.slice(0, 5).map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                    {results.errors.length > 5 && (
                      <div className="italic">
                        ... and {results.errors.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          {!results && !isImporting && (
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
              <p>
                <strong>CSV Format:</strong> First Name, Last Name, Email,
                Phone, Company, Job Title, Notes
              </p>
              <p>
                <strong>vCard Format:</strong> Standard vCard 3.0 format (.vcf)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  selectedContactIds?: string[]; // If provided, only export selected contacts
}

export function ExportModal({
  isOpen,
  onClose,
  userId,
  selectedContactIds,
}: ExportModalProps): JSX.Element | null {
  const [isExporting, setIsExporting] = useState(false);
  const [fileType, setFileType] = useState<'csv' | 'vcard'>('csv');

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let content;
      let filename;
      let mimeType;

      if (fileType === 'csv') {
        content = await exportToCSV(userId, selectedContactIds);
        filename = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        content = await exportToVCard(userId, selectedContactIds);
        filename = `contacts-export-${new Date().toISOString().split('T')[0]}.vcf`;
        mimeType = 'text/vcard';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const count = selectedContactIds?.length || 'all';
      toast.success(`Exported ${count} contact(s) successfully`);
      onClose();
    } catch (error) {
      toast.error('Failed to export contacts');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Download size={24} />
            Export Contacts
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedContactIds
              ? `Export ${selectedContactIds.length} selected contact(s)`
              : 'Export all contacts'}
          </p>

          {/* File Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setFileType('csv')}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                  fileType === 'csv'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'
                }`}
              >
                <FileText size={24} className="mx-auto mb-2" />
                <div className="font-medium">CSV</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Spreadsheet format
                </div>
              </button>
              <button
                onClick={() => setFileType('vcard')}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                  fileType === 'vcard'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'
                }'`}
              >
                <FileText size={24} className="mx-auto mb-2" />
                <div className="font-medium">vCard</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Contact card format
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

