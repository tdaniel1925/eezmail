/**
 * Attachment Filtering Logic
 * Filters out non-document/media attachments like calendar invites, vcards, etc.
 */

// Excluded MIME types that should not appear in attachments page
const EXCLUDED_TYPES = [
  'text/calendar', // .ics calendar invites
  'text/vcard', // .vcf contact cards
  'text/x-vcard',
  'application/ics', // Alternative calendar format
  'application/x-pkcs7-signature', // Email signatures
  'application/pkcs7-signature',
  'application/x-pkcs7-mime',
  'application/pkcs7-mime',
  'application/x-apple-msg-attachment', // Apple-specific
];

// Qualified MIME type prefixes (documents and media)
const QUALIFIED_PREFIXES = [
  'image/', // All images
  'video/', // All videos
  'audio/', // All audio
  'application/pdf', // PDFs
  'application/msword', // Word docs
  'application/vnd.openxmlformats-officedocument.wordprocessingml', // .docx
  'application/vnd.ms-excel', // Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml', // .xlsx
  'application/vnd.ms-powerpoint', // PowerPoint
  'application/vnd.openxmlformats-officedocument.presentationml', // .pptx
  'application/zip', // Archives
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'text/plain', // Text files
  'text/csv', // CSV files
  'application/json', // JSON files
  'application/xml', // XML files
  'text/xml',
];

/**
 * Check if an attachment should be displayed based on its content type
 */
export function isQualifiedAttachment(contentType: string): boolean {
  if (!contentType) return false;

  const normalizedType = contentType.toLowerCase().trim();

  // Check if it's in the excluded list
  if (EXCLUDED_TYPES.some((excluded) => normalizedType.includes(excluded))) {
    return false;
  }

  // Check if it matches any qualified prefix
  return QUALIFIED_PREFIXES.some((prefix) => normalizedType.startsWith(prefix));
}

/**
 * Get a human-readable file type label from content type
 */
export function getFileTypeLabel(contentType: string): string {
  const normalizedType = contentType.toLowerCase();

  if (normalizedType.startsWith('image/')) return 'Image';
  if (normalizedType.startsWith('video/')) return 'Video';
  if (normalizedType.startsWith('audio/')) return 'Audio';
  if (normalizedType === 'application/pdf') return 'PDF';
  if (
    normalizedType.includes('word') ||
    normalizedType.includes('document')
  )
    return 'Document';
  if (
    normalizedType.includes('excel') ||
    normalizedType.includes('spreadsheet')
  )
    return 'Spreadsheet';
  if (
    normalizedType.includes('powerpoint') ||
    normalizedType.includes('presentation')
  )
    return 'Presentation';
  if (
    normalizedType.includes('zip') ||
    normalizedType.includes('rar') ||
    normalizedType.includes('tar') ||
    normalizedType.includes('7z') ||
    normalizedType.includes('gzip')
  )
    return 'Archive';
  if (normalizedType.startsWith('text/')) return 'Text';
  if (normalizedType === 'application/json') return 'JSON';
  if (normalizedType.includes('xml')) return 'XML';

  return 'File';
}

/**
 * Filter attachments array to only include qualified types
 */
export function filterQualifiedAttachments<T extends { contentType: string }>(
  attachments: T[]
): T[] {
  return attachments.filter((att) => isQualifiedAttachment(att.contentType));
}

