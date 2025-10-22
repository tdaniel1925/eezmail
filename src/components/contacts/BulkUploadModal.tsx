'use client';

import { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileUp,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

interface ColumnMapping {
  csvColumn: string;
  targetField: string;
}

const TARGET_FIELDS = [
  { value: '', label: '-- Skip this column --' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'address', label: 'Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'zipCode', label: 'Zip Code' },
  { value: 'country', label: 'Country' },
  { value: 'tags', label: 'Tags (use | to separate)' },
  { value: 'notes', label: 'Notes' },
];

export function BulkUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
}: BulkUploadModalProps): JSX.Element | null {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'complete'>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>(
    {}
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const autoMapHeaders = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const headerMap: Record<string, string> = {
      'first name': 'firstName',
      firstname: 'firstName',
      fname: 'firstName',
      'last name': 'lastName',
      lastname: 'lastName',
      lname: 'lastName',
      email: 'email',
      'email address': 'email',
      'e-mail': 'email',
      phone: 'phone',
      'phone number': 'phone',
      mobile: 'phone',
      telephone: 'phone',
      company: 'company',
      organization: 'company',
      'company name': 'company',
      'job title': 'jobTitle',
      jobtitle: 'jobTitle',
      title: 'jobTitle',
      position: 'jobTitle',
      address: 'address',
      street: 'address',
      city: 'city',
      state: 'state',
      province: 'state',
      'zip code': 'zipCode',
      zip: 'zipCode',
      zipcode: 'zipCode',
      postal: 'zipCode',
      'postal code': 'zipCode',
      country: 'country',
      tags: 'tags',
      labels: 'tags',
      notes: 'notes',
      note: 'notes',
      comments: 'notes',
    };

    headers.forEach((header) => {
      const lower = header.toLowerCase().trim();
      const targetField = headerMap[lower];
      if (targetField) {
        mapping[header] = targetField;
      }
    });

    return mapping;
  };

  const handleFileSelect = async (selectedFile: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.endsWith('.csv')
    ) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);

    // Parse headers for mapping
    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter((line) => line.trim());
      if (lines.length < 1) {
        toast.error('CSV file appears to be empty');
        return;
      }

      const headers = lines[0]
        .split(',')
        .map((h) => h.trim().replace(/^"|"$/g, ''));
      setCsvHeaders(headers);

      // Auto-map headers
      const autoMapping = autoMapHeaders(headers);
      setColumnMappings(autoMapping);

      // Move to mapping step
      setStep('mapping');
    } catch (error) {
      console.error('Error parsing CSV headers:', error);
      toast.error('Failed to parse CSV file');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleMappingChange = (csvColumn: string, targetField: string) => {
    setColumnMappings((prev) => ({
      ...prev,
      [csvColumn]: targetField,
    }));
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    // Validate that at least one required field is mapped
    const mappedFields = Object.values(columnMappings).filter(Boolean);
    const hasRequiredField = mappedFields.some((field) =>
      ['firstName', 'lastName', 'email'].includes(field)
    );

    if (!hasRequiredField) {
      toast.error(
        'Please map at least one of: First Name, Last Name, or Email'
      );
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('columnMappings', JSON.stringify(columnMappings));

      const response = await fetch('/api/contacts/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadResult(result);
        setStep('complete');
        // toast.success(
        //   `Successfully uploaded ${result.success} contact${result.success !== 1 ? 's' : ''}!`
        // );
        onUploadComplete();
      } else {
        toast.error(result.error || 'Failed to upload contacts');
        if (result.errors) {
          setUploadResult(result);
          setStep('complete');
        }
      }
    } catch (error) {
      console.error('Error uploading contacts:', error);
      toast.error('Failed to upload contacts');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `First Name,Last Name,Email,Phone,Company,Job Title,Address,City,State,Zip Code,Country,Tags,Notes
John,Doe,john.doe@example.com,+1-555-123-4567,Acme Corp,Sales Manager,123 Main St,San Francisco,CA,94105,USA,client|vip,Important contact
Jane,Smith,jane.smith@company.com,+1-555-987-6543,Tech Inc,CEO,456 Market St,New York,NY,10001,USA,partner,Follow up next week`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    // toast.success('Template downloaded!');
  };

  const handleClose = () => {
    setFile(null);
    setUploadResult(null);
    setDragActive(false);
    setStep('upload');
    setCsvHeaders([]);
    setColumnMappings({});
    onClose();
  };

  const handleBackToUpload = () => {
    setFile(null);
    setCsvHeaders([]);
    setColumnMappings({});
    setStep('upload');
  };

  const renderUploadStep = () => (
    <>
      // {/* Download Template */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Download
            className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
            size={20}
          />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Need a template?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              Download our CSV template to see the correct format
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Download Template →
            </button>
          </div>
        </div>
      </div>
      // {/* File Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <Upload className="text-gray-400" size={48} />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Drop your file here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                browse
              </button>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supports CSV and Excel files
            </p>
          </div>
        </div>
      </div>
      // {/* Info */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          ✨ Smart Column Mapping
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          After selecting your file, you'll be able to map your CSV columns to
          our contact fields. We'll auto-detect common column names to save you
          time!
        </p>
      </div>
    </>
  );

  const renderMappingStep = () => {
    const mappedFields = Object.values(columnMappings).filter(Boolean);
    const hasRequiredField = mappedFields.some((field) =>
      ['firstName', 'lastName', 'email'].includes(field)
    );

    return (
      <>
        {/* File Info */}
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <FileUp
              className="text-green-600 dark:text-green-400 flex-shrink-0"
              size={20}
            />
            <div className="flex-1">
              <h3 className="font-medium text-green-900 dark:text-green-100">
                {file?.name}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                {csvHeaders.length} columns detected
              </p>
            </div>
            <button
              onClick={handleBackToUpload}
              className="text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Change file
            </button>
          </div>
        </div>

        {/* Mapping Instructions */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
            Map Your Columns
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Match your CSV columns to our contact fields. We've auto-detected
            some mappings for you!
          </p>
        </div>

        {/* Column Mappings */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {csvHeaders.map((header, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {header}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your CSV column
                </p>
              </div>
              <ArrowRight className="text-gray-400 flex-shrink-0" size={20} />
              <div className="flex-1 min-w-0">
                <select
                  value={columnMappings[header] || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TARGET_FIELDS.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Validation Warning */}
        {!hasRequiredField && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="text-yellow-600 dark:text-yellow-400 flex-shrink-0"
                size={20}
              />
              <div>
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Required Field Missing
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Please map at least one of: First Name, Last Name, or Email
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderCompleteStep = () => (
    <>
      {/* Upload Result */}
      {uploadResult && (
        <div className="space-y-4">
          {/* Success Summary */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-600 dark:text-green-400 flex-shrink-0"
                size={24}
              />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100 text-lg">
                  {uploadResult.success} contact
                  {uploadResult.success !== 1 ? 's' : ''} uploaded successfully
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your contacts have been imported and are now available in your
                  contact list.
                </p>
              </div>
            </div>
          </div>

          {/* Errors */}
          {uploadResult.failed > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3 mb-3">
                <XCircle
                  className="text-red-600 dark:text-red-400 flex-shrink-0"
                  size={20}
                />
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100">
                    {uploadResult.failed} contact
                    {uploadResult.failed !== 1 ? 's' : ''} failed
                  </h4>
                </div>
              </div>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-3 space-y-1 max-h-[200px] overflow-y-auto">
                  {uploadResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
                    >
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>
                        Row {error.row}: {error.error}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Bulk Upload Contacts
                {step === 'mapping' && ' - Map Columns'}
                {step === 'complete' && ' - Complete'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {step === 'upload' &&
                  'Import multiple contacts from CSV or Excel file'}
                {step === 'mapping' && 'Map your CSV columns to contact fields'}
                {step === 'complete' && 'Import results'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {step === 'upload' && renderUploadStep()}
            {step === 'mapping' && renderMappingStep()}
            {step === 'complete' && renderCompleteStep()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            {step === 'mapping' && (
              <>
                <button
                  onClick={handleBackToUpload}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={isUploading}
                >
                  Back
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Contacts
                    </>
                  )}
                </button>
              </>
            )}
            {step === 'complete' && (
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            )}
            {step === 'upload' && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
