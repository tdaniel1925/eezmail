/**
 * Email Renderer Service
 * Handles email body fetching, HTML sanitization, and inline image processing
 */

'use server';

import DOMPurify from 'isomorphic-dompurify';

export interface EmailBodyOptions {
  allowImages?: boolean;
  allowStyles?: boolean;
  allowLinks?: boolean;
  blockTrackers?: boolean;
}

/**
 * Fetch full email body from Microsoft Graph API
 */
export async function fetchMicrosoftEmailBody(
  accountId: string,
  messageId: string,
  accessToken: string
): Promise<{ html: string; text: string }> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    const message = await response.json();

    return {
      html: message.body?.contentType === 'html' ? message.body?.content : '',
      text: message.body?.contentType === 'text' ? message.body?.content : '',
    };
  } catch (error) {
    console.error('Error fetching Microsoft email body:', error);
    throw error;
  }
}

/**
 * Fetch full email body from Gmail API
 */
export async function fetchGmailEmailBody(
  accountId: string,
  messageId: string,
  accessToken: string
): Promise<{ html: string; text: string }> {
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    const message = await response.json();

    // Parse Gmail message payload
    let htmlBody = '';
    let textBody = '';

    const findParts = (parts: any[]): void => {
      for (const part of parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/plain' && part.body?.data) {
          textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          findParts(part.parts);
        }
      }
    };

    if (message.payload?.parts) {
      findParts(message.payload.parts);
    } else if (message.payload?.body?.data) {
      // Single part message
      const body = Buffer.from(message.payload.body.data, 'base64').toString(
        'utf-8'
      );
      if (message.payload.mimeType === 'text/html') {
        htmlBody = body;
      } else {
        textBody = body;
      }
    }

    return {
      html: htmlBody,
      text: textBody,
    };
  } catch (error) {
    console.error('Error fetching Gmail email body:', error);
    throw error;
  }
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
 * Download inline images (CID references) from Microsoft Graph
 */
export async function downloadMicrosoftInlineImages(
  messageId: string,
  accessToken: string
): Promise<Record<string, string>> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    const data = await response.json();
    const attachments = data.value || [];

    const cidMap: Record<string, string> = {};

    for (const attachment of attachments) {
      if (attachment.isInline && attachment.contentId) {
        // Convert base64 content to data URL
        const dataUrl = `data:${attachment.contentType};base64,${attachment.contentBytes}`;
        cidMap[attachment.contentId] = dataUrl;
      }
    }

    return cidMap;
  } catch (error) {
    console.error('Error downloading inline images:', error);
    return {};
  }
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
    result = result.replace(
      new RegExp(`cid:${cleanCid}`, 'gi'),
      dataUrl
    );
  }

  return result;
}

/**
 * Convert plain text to HTML (preserve formatting)
 */
export function textToHtml(text: string): string {
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
 * Render email body with full HTML support, sanitization, and inline images
 */
export async function renderEmailBody(
  provider: 'microsoft' | 'gmail' | 'imap',
  accountId: string,
  messageId: string,
  accessToken: string,
  bodyHtml?: string,
  bodyText?: string,
  options: EmailBodyOptions = {}
): Promise<string> {
  try {
    let html = bodyHtml || '';
    let text = bodyText || '';

    // Fetch full body if not provided
    if (!html && !text) {
      if (provider === 'microsoft') {
        const body = await fetchMicrosoftEmailBody(
          accountId,
          messageId,
          accessToken
        );
        html = body.html;
        text = body.text;
      } else if (provider === 'gmail') {
        const body = await fetchGmailEmailBody(accountId, messageId, accessToken);
        html = body.html;
        text = body.text;
      }
    }

    // Use HTML if available, otherwise convert text to HTML
    let content = html || textToHtml(text);

    // Download and replace inline images for Microsoft
    if (provider === 'microsoft' && html) {
      const cidMap = await downloadMicrosoftInlineImages(messageId, accessToken);
      content = replaceCidReferences(content, cidMap);
    }

    // Sanitize HTML
    const sanitized = sanitizeEmailHTML(content, options);

    return sanitized;
  } catch (error) {
    console.error('Error rendering email body:', error);
    return `<p>Error loading email content. Please try again.</p>`;
  }
}

