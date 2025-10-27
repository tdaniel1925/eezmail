/**
 * Email Template Variables System
 *
 * This file defines all available variables for email templates and provides
 * helper functions to generate variable values dynamically.
 */

import { users, sandboxCompanies, subscriptions } from '@/db/schema';

// ============================================================================
// CORE VARIABLE DEFINITIONS
// ============================================================================

/**
 * Default variables available in ALL email templates
 */
export const DEFAULT_VARIABLES = {
  // User Information
  userName: "User's full name or email",
  userEmail: "User's email address",
  userFirstName: "User's first name",
  userLastName: "User's last name",

  // Application URLs
  dashboardLink: 'Link to user dashboard',
  loginLink: 'Link to login page',
  settingsLink: 'Link to user settings',
  helpCenterLink: 'Link to help center',

  // Company/Branding
  appName: 'EaseMail',
  appLogo: 'EaseMail logo URL',
  supportEmail: 'Support email address',
  companyAddress: 'Company physical address',

  // Legal Links
  privacyPolicyLink: 'Link to privacy policy',
  termsOfServiceLink: 'Link to terms of service',
  unsubscribeLink: 'Link to unsubscribe',

  // Date/Time
  currentYear: 'Current year (e.g., 2025)',
  currentDate: 'Current formatted date',
  currentTime: 'Current formatted time',
} as const;

/**
 * Sandbox-specific variables
 */
export const SANDBOX_VARIABLES = {
  companyName: 'Sandbox company name',
  companyId: 'Sandbox company ID',
  sandboxFeatures: 'List of sandbox features',
  adminName: 'Admin who created sandbox',
  adminEmail: 'Admin email',
  expiryDate: 'Sandbox expiry date',
  daysRemaining: 'Days until expiry',
} as const;

/**
 * Subscription/Billing variables
 */
export const SUBSCRIPTION_VARIABLES = {
  subscriptionTier: 'individual/team/enterprise',
  billingCycle: 'monthly/annual',
  nextBillingDate: 'Next billing date',
  billingAmount: 'Amount to be charged',
  invoiceLink: 'Link to invoice',
  paymentMethod: 'Last 4 of payment method',
  trialEndsAt: 'Trial end date',
  trialDaysRemaining: 'Days remaining in trial',
} as const;

/**
 * Password reset variables
 */
export const PASSWORD_RESET_VARIABLES = {
  resetLink: 'Password reset link with token',
  resetToken: 'Reset token (if needed separately)',
  expiryTime: 'Link expiry time (e.g., "24 hours")',
  expiryDateTime: 'Exact expiry date/time',
  requestIp: 'IP address that requested reset',
  requestLocation: 'Approximate location of request',
} as const;

/**
 * Email verification variables
 */
export const EMAIL_VERIFICATION_VARIABLES = {
  verificationLink: 'Email verification link',
  verificationCode: '6-digit verification code',
  expiryTime: 'Code expiry time',
} as const;

/**
 * Security alert variables
 */
export const SECURITY_VARIABLES = {
  eventType: 'Type of security event',
  eventTime: 'When event occurred',
  ipAddress: 'IP address involved',
  location: 'Approximate location',
  deviceInfo: 'Device/browser information',
  actionRequired: 'What user should do',
  securityLink: 'Link to security settings',
} as const;

/**
 * Feature announcement variables
 */
export const FEATURE_VARIABLES = {
  featureName: 'Name of new feature',
  featureDescription: 'Feature description',
  launchDate: 'Feature launch date',
  featureLink: 'Link to feature docs/demo',
  ctaText: 'Call-to-action button text',
  ctaLink: 'Call-to-action button link',
} as const;

/**
 * Support ticket variables
 */
export const SUPPORT_VARIABLES = {
  ticketId: 'Support ticket ID',
  ticketSubject: 'Ticket subject',
  ticketStatus: 'Ticket status',
  ticketLink: 'Link to ticket',
  agentName: 'Assigned agent name',
  agentEmail: 'Agent email',
  responseTime: 'Estimated response time',
} as const;

// ============================================================================
// VARIABLE GENERATION HELPERS
// ============================================================================

/**
 * Base URL for the application (from env or default)
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://app.easemail.ai';
}

/**
 * Generate default variables for any user
 */
export function getDefaultVariables(
  user?: typeof users.$inferSelect
): Record<string, string> {
  const baseUrl = getBaseUrl();
  const currentYear = new Date().getFullYear().toString();
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return {
    // User info
    userName: user?.fullName || user?.email || 'User',
    userEmail: user?.email || '',
    userFirstName:
      user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'User',
    userLastName: user?.fullName?.split(' ').slice(1).join(' ') || '',

    // App URLs
    dashboardLink: `${baseUrl}/dashboard`,
    loginLink: `${baseUrl}/auth/login`,
    settingsLink: `${baseUrl}/settings`,
    helpCenterLink: `${baseUrl}/help`,

    // Branding
    appName: 'EaseMail',
    appLogo: `${baseUrl}/logo.png`,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@easemail.ai',
    companyAddress: '123 Email Street, San Francisco, CA 94102',

    // Legal
    privacyPolicyLink: `${baseUrl}/privacy`,
    termsOfServiceLink: `${baseUrl}/terms`,
    unsubscribeLink: `${baseUrl}/unsubscribe?email=${encodeURIComponent(user?.email || '')}`,

    // Date/Time
    currentYear,
    currentDate,
    currentTime,
  };
}

/**
 * Generate sandbox-specific variables
 */
export function getSandboxVariables(
  company: typeof sandboxCompanies.$inferSelect,
  user?: typeof users.$inferSelect
): Record<string, string> {
  const expiryDate = company.expiresAt
    ? new Date(company.expiresAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Never';

  const daysRemaining = company.expiresAt
    ? Math.ceil(
        (new Date(company.expiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : -1;

  return {
    companyName: company.name,
    companyId: company.id,
    sandboxFeatures: 'Full EaseMail feature set with test data',
    adminName: user?.fullName || 'Admin',
    adminEmail: user?.email || '',
    expiryDate,
    daysRemaining: daysRemaining > 0 ? daysRemaining.toString() : 'Unlimited',
  };
}

/**
 * Generate subscription/billing variables
 */
export function getSubscriptionVariables(
  subscription?: typeof subscriptions.$inferSelect
): Record<string, string> {
  if (!subscription) {
    return {
      subscriptionTier: 'individual',
      billingCycle: 'monthly',
      nextBillingDate: 'N/A',
      billingAmount: '$0.00',
      invoiceLink: '',
      paymentMethod: 'N/A',
      trialEndsAt: '',
      trialDaysRemaining: '0',
    };
  }

  const baseUrl = getBaseUrl();
  const nextBillingDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  const tierPrices = {
    individual: { monthly: '$9.99', annual: '$99.99' },
    team: { monthly: '$49.99', annual: '$499.99' },
    enterprise: { monthly: '$199.99', annual: '$1,999.99' },
  };

  const billingCycle =
    subscription.tier === 'individual' ? 'monthly' : 'monthly'; // Adjust based on your logic
  const tier = subscription.tier || 'individual';
  const billingAmount =
    tierPrices[tier as keyof typeof tierPrices]?.[
      billingCycle as 'monthly' | 'annual'
    ] || '$0.00';

  return {
    subscriptionTier: subscription.tier || 'individual',
    billingCycle,
    nextBillingDate,
    billingAmount,
    invoiceLink: `${baseUrl}/billing/invoices`,
    paymentMethod: '****', // Would come from payment provider
    trialEndsAt: subscription.trialEndsAt
      ? new Date(subscription.trialEndsAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
    trialDaysRemaining: subscription.trialEndsAt
      ? Math.ceil(
          (new Date(subscription.trialEndsAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        ).toString()
      : '0',
  };
}

/**
 * Generate password reset variables
 */
export function getPasswordResetVariables(
  token: string,
  expiryMinutes: number = 60,
  requestInfo?: { ip?: string; location?: string }
): Record<string, string> {
  const baseUrl = getBaseUrl();
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

  return {
    resetLink: `${baseUrl}/auth/reset-password?token=${token}`,
    resetToken: token,
    expiryTime:
      expiryMinutes >= 60
        ? `${expiryMinutes / 60} hours`
        : `${expiryMinutes} minutes`,
    expiryDateTime: expiryDate.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
    requestIp: requestInfo?.ip || 'Unknown',
    requestLocation: requestInfo?.location || 'Unknown location',
  };
}

/**
 * Generate email verification variables
 */
export function getEmailVerificationVariables(
  token: string,
  code: string,
  expiryMinutes: number = 30
): Record<string, string> {
  const baseUrl = getBaseUrl();

  return {
    verificationLink: `${baseUrl}/auth/verify-email?token=${token}`,
    verificationCode: code,
    expiryTime:
      expiryMinutes >= 60
        ? `${expiryMinutes / 60} hours`
        : `${expiryMinutes} minutes`,
  };
}

/**
 * Generate security alert variables
 */
export function getSecurityVariables(event: {
  type: string;
  time: Date;
  ip?: string;
  location?: string;
  device?: string;
  actionRequired?: string;
}): Record<string, string> {
  const baseUrl = getBaseUrl();

  return {
    eventType: event.type,
    eventTime: event.time.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
    ipAddress: event.ip || 'Unknown',
    location: event.location || 'Unknown location',
    deviceInfo: event.device || 'Unknown device',
    actionRequired: event.actionRequired || 'Review your recent activity',
    securityLink: `${baseUrl}/settings/security`,
  };
}

/**
 * Generate feature announcement variables
 */
export function getFeatureVariables(feature: {
  name: string;
  description: string;
  launchDate?: Date;
  link?: string;
  ctaText?: string;
  ctaLink?: string;
}): Record<string, string> {
  const baseUrl = getBaseUrl();

  return {
    featureName: feature.name,
    featureDescription: feature.description,
    launchDate: feature.launchDate
      ? feature.launchDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Soon',
    featureLink: feature.link || `${baseUrl}/features`,
    ctaText: feature.ctaText || 'Learn More',
    ctaLink: feature.ctaLink || feature.link || `${baseUrl}/features`,
  };
}

/**
 * Generate support ticket variables
 */
export function getSupportVariables(ticket: {
  id: string;
  subject: string;
  status: string;
  agentName?: string;
  agentEmail?: string;
  responseTime?: string;
}): Record<string, string> {
  const baseUrl = getBaseUrl();

  return {
    ticketId: ticket.id,
    ticketSubject: ticket.subject,
    ticketStatus: ticket.status,
    ticketLink: `${baseUrl}/support/tickets/${ticket.id}`,
    agentName: ticket.agentName || 'Support Team',
    agentEmail:
      ticket.agentEmail || process.env.SUPPORT_EMAIL || 'support@easemail.ai',
    responseTime: ticket.responseTime || '24 hours',
  };
}

// ============================================================================
// MASTER VARIABLE COMBINER
// ============================================================================

/**
 * Combine all relevant variables for a specific template type
 */
export function getCombinedVariables(options: {
  user?: typeof users.$inferSelect;
  sandboxCompany?: typeof sandboxCompanies.$inferSelect;
  subscription?: typeof subscriptions.$inferSelect;
  passwordResetToken?: string;
  verificationToken?: string;
  verificationCode?: string;
  securityEvent?: any;
  feature?: any;
  supportTicket?: any;
  customVariables?: Record<string, string>;
}): Record<string, string> {
  let variables: Record<string, string> = {};

  // Always include default variables
  variables = { ...variables, ...getDefaultVariables(options.user) };

  // Add sandbox variables if applicable
  if (options.sandboxCompany) {
    variables = {
      ...variables,
      ...getSandboxVariables(options.sandboxCompany, options.user),
    };
  }

  // Add subscription variables if applicable
  if (options.subscription) {
    variables = {
      ...variables,
      ...getSubscriptionVariables(options.subscription),
    };
  }

  // Add password reset variables if applicable
  if (options.passwordResetToken) {
    variables = {
      ...variables,
      ...getPasswordResetVariables(options.passwordResetToken),
    };
  }

  // Add email verification variables if applicable
  if (options.verificationToken && options.verificationCode) {
    variables = {
      ...variables,
      ...getEmailVerificationVariables(
        options.verificationToken,
        options.verificationCode
      ),
    };
  }

  // Add security variables if applicable
  if (options.securityEvent) {
    variables = {
      ...variables,
      ...getSecurityVariables(options.securityEvent),
    };
  }

  // Add feature variables if applicable
  if (options.feature) {
    variables = { ...variables, ...getFeatureVariables(options.feature) };
  }

  // Add support ticket variables if applicable
  if (options.supportTicket) {
    variables = { ...variables, ...getSupportVariables(options.supportTicket) };
  }

  // Add any custom variables (overrides all others)
  if (options.customVariables) {
    variables = { ...variables, ...options.customVariables };
  }

  return variables;
}

/**
 * List all available variables for a template type
 */
export function getAvailableVariables(
  templateType: 'transactional' | 'marketing' | 'system' | 'sandbox'
): string[] {
  const defaultVars = Object.keys(DEFAULT_VARIABLES);

  switch (templateType) {
    case 'sandbox':
      return [...defaultVars, ...Object.keys(SANDBOX_VARIABLES)];
    case 'transactional':
      return [
        ...defaultVars,
        ...Object.keys(PASSWORD_RESET_VARIABLES),
        ...Object.keys(EMAIL_VERIFICATION_VARIABLES),
        ...Object.keys(SUBSCRIPTION_VARIABLES),
        ...Object.keys(SECURITY_VARIABLES),
      ];
    case 'marketing':
      return [
        ...defaultVars,
        ...Object.keys(FEATURE_VARIABLES),
        ...Object.keys(SUBSCRIPTION_VARIABLES),
      ];
    case 'system':
      return [
        ...defaultVars,
        ...Object.keys(SUPPORT_VARIABLES),
        ...Object.keys(SECURITY_VARIABLES),
      ];
    default:
      return defaultVars;
  }
}
