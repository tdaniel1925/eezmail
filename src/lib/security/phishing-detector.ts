/**
 * AI-Powered Phishing Detection
 * Analyzes emails for phishing indicators
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PhishingAnalysis {
  isPhishing: boolean;
  confidence: number; // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  indicators: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  recommendation: 'safe' | 'caution' | 'quarantine' | 'delete';
  reasons: string[];
}

export interface EmailSecurityData {
  fromAddress: string | { email: string; name?: string };
  fromName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  links?: string[];
  attachments?: Array<{ filename: string; contentType: string }>;
  headers?: Record<string, string>;
}

/**
 * Helper to extract email string from various formats
 */
function getEmailAddress(
  fromAddress: string | { email: string; name?: string }
): string {
  if (typeof fromAddress === 'string') {
    return fromAddress;
  }
  return fromAddress.email || '';
}

/**
 * Analyze email for phishing indicators
 */
export async function detectPhishing(
  email: EmailSecurityData
): Promise<PhishingAnalysis> {
  // Quick heuristic checks first (fast, no AI cost)
  const heuristicIndicators = runHeuristicChecks(email);

  // If heuristics show high risk, skip AI and return immediately
  if (heuristicIndicators.highRiskCount >= 3) {
    return {
      isPhishing: true,
      confidence: 95,
      riskLevel: 'critical',
      indicators: heuristicIndicators.indicators,
      recommendation: 'delete',
      reasons: [
        'Multiple high-risk indicators detected',
        ...heuristicIndicators.indicators.map((i) => i.description),
      ],
    };
  }

  // Use AI for deeper analysis if heuristics are inconclusive
  if (
    heuristicIndicators.mediumRiskCount > 0 ||
    heuristicIndicators.lowRiskCount > 1
  ) {
    const aiAnalysis = await analyzeWithAI(email, heuristicIndicators);
    return aiAnalysis;
  }

  // No indicators found - safe
  return {
    isPhishing: false,
    confidence: 90,
    riskLevel: 'safe',
    indicators: [],
    recommendation: 'safe',
    reasons: ['No suspicious indicators detected'],
  };
}

/**
 * Fast heuristic checks for common phishing patterns
 */
function runHeuristicChecks(email: EmailSecurityData): {
  indicators: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
} {
  const indicators: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }> = [];

  const text = `${email.subject} ${email.bodyText}`.toLowerCase();

  // Check for urgency/pressure tactics
  const urgencyPatterns = [
    /urgent/i,
    /immediate action/i,
    /act now/i,
    /expires (soon|today|in \d+ hours)/i,
    /limited time/i,
    /verify (your account|immediately)/i,
    /suspend(ed)?/i,
    /unusual activity/i,
  ];

  if (urgencyPatterns.some((pattern) => pattern.test(text))) {
    indicators.push({
      type: 'urgency',
      severity: 'medium',
      description: 'Uses urgency or pressure tactics',
    });
  }

  // Check for threats
  const threatPatterns = [
    /account.*clos(e|ed|ing)/i,
    /account.*terminat(e|ed|ing)/i,
    /legal action/i,
    /fail(ed)? to (verify|confirm)/i,
  ];

  if (threatPatterns.some((pattern) => pattern.test(text))) {
    indicators.push({
      type: 'threats',
      severity: 'high',
      description: 'Contains threatening language',
    });
  }

  // Check for credential requests
  const credentialPatterns = [
    /enter.*password/i,
    /confirm.*password/i,
    /update.*password/i,
    /verify.*identity/i,
    /social security/i,
    /credit card/i,
    /bank account/i,
  ];

  if (credentialPatterns.some((pattern) => pattern.test(text))) {
    indicators.push({
      type: 'credentials',
      severity: 'high',
      description: 'Requests sensitive information',
    });
  }

  // Check for suspicious links
  if (email.links && email.links.length > 0) {
    for (const link of email.links) {
      // IP address in URL
      if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(link)) {
        indicators.push({
          type: 'suspicious_link',
          severity: 'high',
          description: 'Contains IP address URL (suspicious)',
        });
      }

      // Shortened URLs
      if (/(bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly)/.test(link)) {
        indicators.push({
          type: 'shortened_url',
          severity: 'low',
          description: 'Contains shortened URL',
        });
      }

      // Suspicious TLDs
      if (/\.(tk|ml|ga|cf|gq|xyz|top)\//.test(link)) {
        indicators.push({
          type: 'suspicious_tld',
          severity: 'medium',
          description: 'Suspicious domain extension',
        });
      }

      // Misleading link text
      const visibleDomain = link.match(/https?:\/\/([^\/]+)/)?.[1];
      if (
        visibleDomain &&
        text.includes('paypal') &&
        !visibleDomain.includes('paypal')
      ) {
        indicators.push({
          type: 'domain_mismatch',
          severity: 'high',
          description: "Link text doesn't match actual URL",
        });
      }
    }
  }

  // Check sender domain
  const fromEmailString = getEmailAddress(email.fromAddress);
  const fromDomain = fromEmailString.split('@')[1]?.toLowerCase();
  const suspiciousDomains = [
    'tempmail',
    'guerrillamail',
    'throwaway',
    '10minutemail',
  ];
  if (
    suspiciousDomains.some((suspicious) => fromDomain?.includes(suspicious))
  ) {
    indicators.push({
      type: 'suspicious_sender',
      severity: 'medium',
      description: 'Sender uses temporary email service',
    });
  }

  // Check for domain spoofing (common brands)
  const commonBrands = [
    'paypal',
    'amazon',
    'microsoft',
    'apple',
    'google',
    'bank',
  ];
  const hasBrandInName = commonBrands.some((brand) =>
    email.fromName?.toLowerCase().includes(brand)
  );
  const hasBrandInDomain = commonBrands.some((brand) =>
    fromDomain?.includes(brand)
  );

  if (hasBrandInName && !hasBrandInDomain) {
    indicators.push({
      type: 'domain_spoofing',
      severity: 'high',
      description: "Sender name doesn't match email domain (possible spoofing)",
    });
  }

  // Check for poor grammar/spelling (simple check)
  const grammarIssues = [
    /\b(recieve|occured|seperate|definately|alot)\b/i,
    /\!\!\!+/,
    /\?\?\?+/,
    /[A-Z]{5,}/,
  ];

  if (grammarIssues.some((pattern) => pattern.test(text))) {
    indicators.push({
      type: 'poor_grammar',
      severity: 'low',
      description: 'Contains spelling or grammar issues',
    });
  }

  // Check for suspicious attachments
  if (email.attachments) {
    const dangerousExtensions = [
      '.exe',
      '.scr',
      '.bat',
      '.cmd',
      '.pif',
      '.vbs',
      '.js',
    ];
    const hasExecutable = email.attachments.some((att) =>
      dangerousExtensions.some((ext) =>
        att.filename.toLowerCase().endsWith(ext)
      )
    );

    if (hasExecutable) {
      indicators.push({
        type: 'dangerous_attachment',
        severity: 'high',
        description: 'Contains potentially dangerous executable file',
      });
    }
  }

  // Count by severity
  const lowRiskCount = indicators.filter((i) => i.severity === 'low').length;
  const mediumRiskCount = indicators.filter(
    (i) => i.severity === 'medium'
  ).length;
  const highRiskCount = indicators.filter((i) => i.severity === 'high').length;

  return {
    indicators,
    lowRiskCount,
    mediumRiskCount,
    highRiskCount,
  };
}

/**
 * Use AI for deeper phishing analysis
 */
async function analyzeWithAI(
  email: EmailSecurityData,
  heuristicResults: ReturnType<typeof runHeuristicChecks>
): Promise<PhishingAnalysis> {
  const systemPrompt = `You are a cybersecurity expert specializing in phishing detection. Analyze the email and determine if it's a phishing attempt.

Consider:
- Sender legitimacy
- Content intent and tone
- Urgency or pressure tactics
- Requests for sensitive information
- Link legitimacy
- Overall context

Heuristic checks already found these indicators:
${heuristicResults.indicators.map((i) => `- ${i.description}`).join('\n')}

Return JSON:
{
  "isPhishing": boolean,
  "confidence": number (0-100),
  "riskLevel": "safe" | "low" | "medium" | "high" | "critical",
  "reasons": string[],
  "recommendation": "safe" | "caution" | "quarantine" | "delete"
}`;

  const emailContext = `
From: ${email.fromName || ''} <${getEmailAddress(email.fromAddress)}>
Subject: ${email.subject}

Body:
${email.bodyText.slice(0, 2000)}

${email.links ? `Links: ${email.links.slice(0, 5).join(', ')}` : ''}
${email.attachments ? `Attachments: ${email.attachments.map((a) => a.filename).join(', ')}` : ''}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: emailContext },
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      response_format: { type: 'json_object' },
    });

    const aiResult = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      isPhishing: aiResult.isPhishing || false,
      confidence: aiResult.confidence || 50,
      riskLevel: aiResult.riskLevel || 'medium',
      indicators: heuristicResults.indicators,
      recommendation: aiResult.recommendation || 'caution',
      reasons: aiResult.reasons || [],
    };
  } catch (error) {
    console.error('AI phishing analysis error:', error);

    // Fallback to heuristic results
    const highRiskCount = heuristicResults.highRiskCount;
    const mediumRiskCount = heuristicResults.mediumRiskCount;

    return {
      isPhishing: highRiskCount >= 2 || mediumRiskCount >= 3,
      confidence: 70,
      riskLevel:
        highRiskCount >= 2 ? 'high' : mediumRiskCount >= 3 ? 'medium' : 'low',
      indicators: heuristicResults.indicators,
      recommendation: highRiskCount >= 2 ? 'quarantine' : 'caution',
      reasons: heuristicResults.indicators.map((i) => i.description),
    };
  }
}

/**
 * Check if phishing detection should run for this email
 */
export function shouldCheckPhishing(email: EmailSecurityData): boolean {
  // Skip for known contacts (implement your own logic)
  // Skip for internal emails
  const fromAddress = getEmailAddress(email.fromAddress);
  const fromDomain = fromAddress.split('@')[1]?.toLowerCase();

  // Always check external emails
  return true;
}
