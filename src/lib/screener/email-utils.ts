'use client';

export interface Email {
  id: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  fromAddress: {
    email: string;
    name?: string;
  };
  receivedAt: Date;
}

/**
 * Check if email is a receipt/invoice
 */
export function isReceipt(email: Email): boolean {
  const keywords = [
    'receipt',
    'invoice',
    'payment',
    'transaction',
    'order confirmation',
    'purchase',
    'billing',
    'payment confirmation',
    'order summary',
    'payment receipt',
    'invoice #',
    'receipt #',
    'order #',
  ];

  const subject = email.subject.toLowerCase();
  const body = (email.bodyText || email.bodyHtml || '').toLowerCase();

  return keywords.some(
    (keyword) => subject.includes(keyword) || body.includes(keyword)
  );
}

/**
 * Check if email is likely spam
 */
export function isLikelySpam(email: Email): boolean {
  const spamIndicators = [
    'unsubscribe',
    'click here',
    'limited time',
    'act now',
    'urgent',
    'free money',
    'congratulations',
    'winner',
    'lottery',
    'viagra',
    'weight loss',
    'make money',
    'work from home',
    'guaranteed',
  ];

  const subject = email.subject.toLowerCase();
  const body = (email.bodyText || email.bodyHtml || '').toLowerCase();

  return spamIndicators.some(
    (indicator) => subject.includes(indicator) || body.includes(indicator)
  );
}

/**
 * Check if email is a newsletter
 */
export function isNewsletter(email: Email): boolean {
  const newsletterIndicators = [
    'newsletter',
    'digest',
    'weekly',
    'daily',
    'monthly',
    'newsletter',
    'updates',
    'roundup',
    'summary',
  ];

  const subject = email.subject.toLowerCase();
  const senderDomain =
    email.fromAddress.email.split('@')[1]?.toLowerCase() || '';

  return newsletterIndicators.some(
    (indicator) =>
      subject.includes(indicator) || senderDomain.includes(indicator)
  );
}
