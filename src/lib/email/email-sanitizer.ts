/**
 * Email HTML Sanitizer (Client-safe version)
 * Can be used in both client and server components
 */

import DOMPurify from 'isomorphic-dompurify';

export interface EmailBodyOptions {
  allowImages?: boolean;
  allowStyles?: boolean;
  allowLinks?: boolean;
  blockTrackers?: boolean;
  proxyImages?: boolean; // Proxy external images through our server
}

/**
 * Sanitize HTML email content
 */
export function sanitizeEmailHTML(
  htmlContent: string,
  options: EmailBodyOptions = {}
): string {
  const {
    allowImages = true,
    allowStyles = true,
    allowLinks = true,
    blockTrackers = true,
    proxyImages = true, // Default to proxying images
  } = options;

  const config: any = {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'ul',
      'ol',
      'li',
      'div',
      'span',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'pre',
      'code',
      'small',
      'b',
      'i',
      'hr',
    ],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: [
      'onclick',
      'onerror',
      'onload',
      'onmouseover',
      'onfocus',
      'onblur',
    ],
  };

  // Allow images if specified
  if (allowImages) {
    config.ALLOWED_TAGS.push('img');
    config.ALLOWED_ATTR.push('src', 'alt', 'width', 'height');
  }

  // Allow styles if specified
  if (allowStyles) {
    config.ALLOWED_ATTR.push('style');
  }

  // Allow links if specified
  if (allowLinks) {
    config.ALLOWED_TAGS.push('a');
    config.ALLOWED_ATTR.push('href', 'target', 'rel');
  }

  let sanitized = DOMPurify.sanitize(htmlContent, config);

  // Proxy images through our server to block trackers and protect privacy
  if (proxyImages && allowImages) {
    sanitized = sanitized.replace(
      /<img([^>]*)src=["']([^"']+)["']([^>]*)>/gi,
      (match, before, src, after) => {
        // Don't proxy data URLs
        if (src.startsWith('data:')) {
          return match;
        }
        // Don't proxy already proxied URLs
        if (src.includes('/api/proxy/image')) {
          return match;
        }
        // Proxy external images
        const proxiedSrc = `/api/proxy/image?url=${encodeURIComponent(src)}`;
        return `<img${before}src="${proxiedSrc}"${after}>`;
      }
    );
  }

  // Block tracking pixels if specified
  if (blockTrackers && allowImages) {
    // Remove 1x1 tracking pixels
    sanitized = sanitized.replace(
      /<img[^>]*width=["']1["'][^>]*height=["']1["'][^>]*>/gi,
      ''
    );
    sanitized = sanitized.replace(
      /<img[^>]*height=["']1["'][^>]*width=["']1["'][^>]*>/gi,
      ''
    );

    // Remove common tracking domains
    const trackingDomains = [
      'track',
      'analytics',
      'pixel',
      'beacon',
      'metrics',
      'logger',
    ];
    const trackingRegex = new RegExp(
      `<img[^>]*src=["'][^"']*(?:${trackingDomains.join('|')})[^"']*["'][^>]*>`,
      'gi'
    );
    sanitized = sanitized.replace(trackingRegex, '');
  }

  return sanitized;
}

/**
 * Convert plain text to HTML (preserve formatting)
 */
export function textToHtml(text: string): string {
  if (!text) return '';

  return text
    .split('\n')
    .map((line) => {
      // Escape HTML entities
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      // Convert URLs to links
      const withLinks = escaped.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      return `<p>${withLinks || '<br>'}</p>`;
    })
    .join('');
}

/**
 * Replace CID references with data URLs in HTML
 */
export function replaceCidReferences(
  html: string,
  cidMap: Record<string, string>
): string {
  let result = html;

  for (const [cid, dataUrl] of Object.entries(cidMap)) {
    // Remove angle brackets if present
    const cleanCid = cid.replace(/^<|>$/g, '');
    // Replace cid: references
    result = result.replace(new RegExp(`cid:${cleanCid}`, 'gi'), dataUrl);
  }

  return result;
}

