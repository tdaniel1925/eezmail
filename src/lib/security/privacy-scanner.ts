/**
 * Privacy Scanner - Detects Sensitive Data in Emails
 * Scans outgoing emails for SSN, credit cards, API keys, passwords, etc.
 */

'use server';

export interface SensitiveDataMatch {
  type:
    | 'ssn'
    | 'credit_card'
    | 'api_key'
    | 'password'
    | 'phone'
    | 'address'
    | 'email'
    | 'custom';
  value: string; // Partially masked
  position: { start: number; end: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface PrivacyScanResult {
  hasSensitiveData: boolean;
  matches: SensitiveDataMatch[];
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'send' | 'review' | 'encrypt' | 'remove';
  warnings: string[];
}

/**
 * Scan email content for sensitive data
 */
export async function scanForSensitiveData(
  text: string,
  context?: {
    isReply?: boolean;
    recipientDomain?: string;
  }
): Promise<PrivacyScanResult> {
  const matches: SensitiveDataMatch[] = [];

  // Social Security Numbers (US)
  const ssnMatches = findSSN(text);
  matches.push(...ssnMatches);

  // Credit Card Numbers
  const ccMatches = findCreditCards(text);
  matches.push(...ccMatches);

  // API Keys / Tokens
  const apiKeyMatches = findAPIKeys(text);
  matches.push(...apiKeyMatches);

  // Passwords / Secrets
  const passwordMatches = findPasswords(text);
  matches.push(...passwordMatches);

  // Phone Numbers (US)
  const phoneMatches = findPhoneNumbers(text);
  matches.push(...phoneMatches);

  // Email Addresses (if suspicious)
  const emailMatches = findSuspiciousEmails(text);
  matches.push(...emailMatches);

  // Physical Addresses
  const addressMatches = findPhysicalAddresses(text);
  matches.push(...addressMatches);

  // Determine overall risk level
  const criticalCount = matches.filter((m) => m.severity === 'critical').length;
  const highCount = matches.filter((m) => m.severity === 'high').length;
  const mediumCount = matches.filter((m) => m.severity === 'medium').length;

  let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  let recommendation: 'send' | 'review' | 'encrypt' | 'remove';

  if (criticalCount > 0) {
    riskLevel = 'critical';
    recommendation = 'remove';
  } else if (highCount >= 2) {
    riskLevel = 'high';
    recommendation = 'encrypt';
  } else if (highCount === 1 || mediumCount >= 2) {
    riskLevel = 'medium';
    recommendation = 'review';
  } else if (mediumCount === 1) {
    riskLevel = 'low';
    recommendation = 'review';
  } else {
    riskLevel = 'safe';
    recommendation = 'send';
  }

  // Generate warnings
  const warnings: string[] = [];
  if (criticalCount > 0) {
    warnings.push(
      'Critical: Contains highly sensitive data that should never be sent unencrypted'
    );
  }
  if (highCount > 0) {
    warnings.push(`Found ${highCount} high-risk sensitive data item(s)`);
  }
  if (mediumCount > 0) {
    warnings.push(`Found ${mediumCount} potentially sensitive item(s)`);
  }

  return {
    hasSensitiveData: matches.length > 0,
    matches,
    riskLevel,
    recommendation,
    warnings,
  };
}

/**
 * Find Social Security Numbers
 */
function findSSN(text: string): SensitiveDataMatch[] {
  const matches: SensitiveDataMatch[] = [];

  // Pattern: XXX-XX-XXXX or XXXXXXXXX
  const ssnPattern =
    /\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b/g;

  let match;
  while ((match = ssnPattern.exec(text)) !== null) {
    const value = match[0];
    // Only flag if it looks like a real SSN (basic validation)
    if (value.replace(/\D/g, '').length === 9) {
      matches.push({
        type: 'ssn',
        value: `***-**-${value.slice(-4)}`, // Mask all but last 4
        position: { start: match.index, end: match.index + value.length },
        severity: 'critical',
        recommendation: 'Remove SSN from email. Never send unencrypted.',
      });
    }
  }

  return matches;
}

/**
 * Find Credit Card Numbers
 */
function findCreditCards(text: string): SensitiveDataMatch[] {
  const matches: SensitiveDataMatch[] = [];

  // Pattern for common card formats (13-19 digits)
  const ccPattern = /\b(?:\d{4}[-\s]?){3}\d{4,7}\b/g;

  let match;
  while ((match = ccPattern.exec(text)) !== null) {
    const value = match[0];
    const digits = value.replace(/\D/g, '');

    // Luhn algorithm validation
    if (digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)) {
      matches.push({
        type: 'credit_card',
        value: `****-****-****-${digits.slice(-4)}`,
        position: { start: match.index, end: match.index + value.length },
        severity: 'critical',
        recommendation:
          'Remove credit card number. Use secure payment link instead.',
      });
    }
  }

  return matches;
}

/**
 * Luhn algorithm for credit card validation
 */
function luhnCheck(digits: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Find API Keys and Tokens
 */
function findAPIKeys(text: string): SensitiveDataMatch[] {
  const matches: SensitiveDataMatch[] = [];

  const patterns = [
    // Generic API key patterns
    { regex: /\b([a-zA-Z0-9_-]{32,})\b/g, name: 'API Key' },
    // AWS
    { regex: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key' },
    // Stripe
    { regex: /sk_live_[0-9a-zA-Z]{24,}/g, name: 'Stripe Secret Key' },
    // GitHub
    { regex: /ghp_[0-9a-zA-Z]{36}/g, name: 'GitHub Personal Access Token' },
    // OpenAI
    { regex: /sk-[a-zA-Z0-9]{48}/g, name: 'OpenAI API Key' },
    // Google API
    { regex: /AIza[0-9A-Za-z\-_]{35}/g, name: 'Google API Key' },
  ];

  for (const { regex, name } of patterns) {
    let match;
    regex.lastIndex = 0; // Reset regex
    while ((match = regex.exec(text)) !== null) {
      const value = match[0];

      // Skip if it's just a long word without typical key characteristics
      if (name === 'API Key' && !/[A-Z]/.test(value)) continue;

      matches.push({
        type: 'api_key',
        value: `${value.slice(0, 8)}...${value.slice(-4)}`,
        position: { start: match.index, end: match.index + value.length },
        severity: 'critical',
        recommendation: `${name} detected. Remove immediately and rotate the key.`,
      });
    }
  }

  return matches;
}

/**
 * Find Password-like strings
 */
function findPasswords(text: string): SensitiveDataMatch[] {
  const matches: SensitiveDataMatch[] = [];

  // Look for password labels followed by values
  const passwordPattern = /(?:password|passwd|pwd)[\s:=]+([^\s,;]{6,})/gi;

  let match;
  while ((match = passwordPattern.exec(text)) !== null) {
    const value = match[1];

    matches.push({
      type: 'password',
      value: '********',
      position: { start: match.index, end: match.index + match[0].length },
      severity: 'critical',
      recommendation:
        'Remove password from email. Never send passwords via email.',
    });
  }

  return matches;
}

/**
 * Find Phone Numbers
 */
function findPhoneNumbers(text: string): SensitiveDataMatch[] {
  const matches: SensitiveDataMatch[] = [];

  // US phone number patterns
  const phonePattern =
    /\b(?:\+?1[-.\s]?)?\(?([2-9]\d{2})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g;

  let match;
  while ((match = phonePattern.exec(text)) !== null) {
    const value = match[0];

    matches.push({
      type: 'phone',
      value: `(***) ***-${match[3]}`,
      position: { start: match.index, end: match.index + value.length },
      severity: 'medium',
      recommendation: 'Phone number detected. Verify recipient before sending.',
    });
  }

  return matches;
}

/**
 * Find suspicious email addresses (not in typical signature)
 */
function findSuspiciousEmails(text: string): SensitiveDataMatch[] {
  const matches: SensitiveDataMatch[] = [];

  // Email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

  // Check if email appears in a context that suggests it's shared data
  const suspiciousContexts = [
    /account.*:\s*\S+@/i,
    /username.*:\s*\S+@/i,
    /login.*:\s*\S+@/i,
    /email.*:\s*\S+@/i,
  ];

  let match;
  while ((match = emailPattern.exec(text)) !== null) {
    const value = match[0];
    const contextStart = Math.max(0, match.index - 50);
    const contextText = text.slice(contextStart, match.index + value.length);

    // Check if it's in a suspicious context
    if (suspiciousContexts.some((pattern) => pattern.test(contextText))) {
      const [localPart, domain] = value.split('@');
      matches.push({
        type: 'email',
        value: `${localPart.slice(0, 2)}***@${domain}`,
        position: { start: match.index, end: match.index + value.length },
        severity: 'medium',
        recommendation:
          'Sharing account credentials? Use secure method instead.',
      });
    }
  }

  return matches;
}

/**
 * Find physical addresses (US)
 */
function findPhysicalAddresses(text: string): SensitiveDataMatch[] {
  const matches: SensitiveDataMatch[] = [];

  // Simple pattern for US addresses (street number + street name + city/state/zip)
  const addressPattern =
    /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|parkway|pkwy)[,\s]+\w+[,\s]+[A-Z]{2}\s+\d{5}(-\d{4})?\b/gi;

  let match;
  while ((match = addressPattern.exec(text)) !== null) {
    const value = match[0];

    matches.push({
      type: 'address',
      value: '*** [Address Redacted] ***',
      position: { start: match.index, end: match.index + value.length },
      severity: 'medium',
      recommendation:
        'Physical address detected. Verify recipient needs this information.',
    });
  }

  return matches;
}

/**
 * Mask text by replacing sensitive data
 */
export function maskSensitiveData(
  text: string,
  matches: SensitiveDataMatch[]
): string {
  let maskedText = text;

  // Sort matches by position (reverse order to avoid offset issues)
  const sortedMatches = [...matches].sort(
    (a, b) => b.position.start - a.position.start
  );

  for (const match of sortedMatches) {
    const before = maskedText.slice(0, match.position.start);
    const after = maskedText.slice(match.position.end);
    maskedText = before + `[${match.type.toUpperCase()} REDACTED]` + after;
  }

  return maskedText;
}
