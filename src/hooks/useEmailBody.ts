/**
 * Hook for fetching and rendering email bodies with HTML sanitization
 */

import { useState, useEffect } from 'react';
import {
  sanitizeEmailHTML,
  textToHtml,
  type EmailBodyOptions,
} from '@/lib/email/email-sanitizer';

export interface UseEmailBodyOptions extends EmailBodyOptions {
  accountId?: string;
  messageId?: string;
  provider?: 'microsoft' | 'gmail' | 'imap';
  bodyHtml?: string | null;
  bodyText?: string | null;
}

export function useEmailBody(options: UseEmailBodyOptions) {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function renderEmail() {
      try {
        setIsLoading(true);
        setError(null);

        const {
          bodyHtml,
          bodyText,
          allowImages = true,
          allowStyles = true,
          allowLinks = true,
          blockTrackers = true,
        } = options;

        // Use provided HTML or text
        let html = bodyHtml || '';
        let text = bodyText || '';

        // Convert text to HTML if no HTML available
        if (!html && text) {
          html = textToHtml(text);
        }

        // Sanitize the HTML
        if (html) {
          const sanitized = sanitizeEmailHTML(html, {
            allowImages,
            allowStyles,
            allowLinks,
            blockTrackers,
          });
          setRenderedHtml(sanitized);
        } else {
          setRenderedHtml('<p>No content available</p>');
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error rendering email:', err);
        setError(err instanceof Error ? err.message : 'Failed to render email');
        setRenderedHtml('<p>Error loading email content</p>');
        setIsLoading(false);
      }
    }

    renderEmail();
  }, [
    options.bodyHtml,
    options.bodyText,
    options.allowImages,
    options.allowStyles,
    options.allowLinks,
    options.blockTrackers,
  ]);

  return { renderedHtml, isLoading, error };
}

