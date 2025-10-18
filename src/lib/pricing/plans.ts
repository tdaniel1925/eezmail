/**
 * Pricing Plans and Feature Definitions
 * 
 * Defines all available subscription tiers, features, and limits
 */

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month' as const,
    stripeProductId: null,
    stripePriceId: null,
    description: 'Try out the basics',
    features: [
      '1 email account',
      '1,000 emails stored',
      '10 RAG searches per day',
      '50 AI queries per month',
      'Basic email management',
      'Standard support',
    ],
    limits: {
      emailAccounts: 1,
      emailsStored: 1000,
      ragSearchesPerDay: 10,
      aiQueriesPerMonth: 50,
      storageGB: 1,
      customLabels: 5,
      customFolders: 3,
      emailRules: 5,
      contactsStored: 100,
      attachmentSizeLimit: 10, // MB
    },
    highlighted: false,
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 15,
    interval: 'month' as const,
    stripeProductId: process.env.STRIPE_STARTER_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    description: 'For professionals',
    features: [
      '3 email accounts',
      '10,000 emails stored',
      '100 RAG searches per day',
      '500 AI queries per month',
      'Advanced email management',
      'Contact management',
      'Email scheduling',
      'Priority support',
    ],
    limits: {
      emailAccounts: 3,
      emailsStored: 10000,
      ragSearchesPerDay: 100,
      aiQueriesPerMonth: 500,
      storageGB: 10,
      customLabels: 25,
      customFolders: 10,
      emailRules: 25,
      contactsStored: 1000,
      attachmentSizeLimit: 25, // MB
    },
    highlighted: false,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 35,
    interval: 'month' as const,
    stripeProductId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    description: 'For teams',
    features: [
      '10 email accounts',
      '50,000 emails stored',
      'Unlimited RAG searches',
      '2,000 AI queries per month',
      'Everything in Starter',
      'Team collaboration',
      'Advanced AI features',
      'Custom integrations',
      'Dedicated support',
    ],
    limits: {
      emailAccounts: 10,
      emailsStored: 50000,
      ragSearchesPerDay: -1, // -1 = unlimited
      aiQueriesPerMonth: 2000,
      storageGB: 50,
      customLabels: -1,
      customFolders: -1,
      emailRules: -1,
      contactsStored: -1,
      attachmentSizeLimit: 100, // MB
    },
    highlighted: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Custom pricing
    interval: 'month' as const,
    stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    description: 'For large organizations',
    features: [
      'Unlimited email accounts',
      'Unlimited emails stored',
      'Unlimited RAG searches',
      'Unlimited AI queries',
      'Everything in Professional',
      'Custom AI models',
      'SSO & SAML',
      'Advanced security',
      'API access',
      'White-label options',
      '24/7 Premium support',
      'Dedicated account manager',
    ],
    limits: {
      emailAccounts: -1,
      emailsStored: -1,
      ragSearchesPerDay: -1,
      aiQueriesPerMonth: -1,
      storageGB: -1,
      customLabels: -1,
      customFolders: -1,
      emailRules: -1,
      contactsStored: -1,
      attachmentSizeLimit: 500, // MB
    },
    highlighted: false,
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];

/**
 * Get plan by ID
 */
export function getPlan(planId: PlanId): Plan {
  return PLANS[planId];
}

/**
 * Get all plans
 */
export function getAllPlans(): Plan[] {
  return Object.values(PLANS);
}

/**
 * Get plan by Stripe price ID
 */
export function getPlanByStripePriceId(priceId: string): Plan | null {
  return (
    Object.values(PLANS).find((plan) => plan.stripePriceId === priceId) || null
  );
}

/**
 * Check if a plan has a specific limit
 */
export function hasLimit(planId: PlanId, limitKey: keyof Plan['limits']): boolean {
  const plan = getPlan(planId);
  const limit = plan.limits[limitKey];
  return limit !== -1;
}

/**
 * Get limit value for a plan
 * Returns -1 for unlimited
 */
export function getLimit(planId: PlanId, limitKey: keyof Plan['limits']): number {
  const plan = getPlan(planId);
  return plan.limits[limitKey];
}

/**
 * Check if usage is within plan limits
 */
export function isWithinLimit(
  planId: PlanId,
  limitKey: keyof Plan['limits'],
  currentUsage: number
): boolean {
  const limit = getLimit(planId, limitKey);
  if (limit === -1) return true; // Unlimited
  return currentUsage < limit;
}

/**
 * Calculate usage percentage
 * Returns 0-100 for limited plans, 0 for unlimited
 */
export function getUsagePercentage(
  planId: PlanId,
  limitKey: keyof Plan['limits'],
  currentUsage: number
): number {
  const limit = getLimit(planId, limitKey);
  if (limit === -1) return 0; // Unlimited
  if (limit === 0) return 100;
  return Math.min(100, Math.round((currentUsage / limit) * 100));
}

/**
 * Check if upgrade is needed based on usage
 */
export function needsUpgrade(
  planId: PlanId,
  limitKey: keyof Plan['limits'],
  currentUsage: number,
  threshold: number = 0.9 // 90% usage
): boolean {
  const limit = getLimit(planId, limitKey);
  if (limit === -1) return false; // Unlimited
  return currentUsage >= limit * threshold;
}

/**
 * Get recommended plan based on usage
 */
export function getRecommendedPlan(usage: {
  emailAccounts: number;
  emailsStored: number;
  ragSearchesPerDay: number;
  aiQueriesPerMonth: number;
}): PlanId {
  // Check each plan from lowest to highest
  for (const [planId, plan] of Object.entries(PLANS)) {
    const limits = plan.limits;
    
    if (
      (limits.emailAccounts === -1 || usage.emailAccounts <= limits.emailAccounts) &&
      (limits.emailsStored === -1 || usage.emailsStored <= limits.emailsStored) &&
      (limits.ragSearchesPerDay === -1 || usage.ragSearchesPerDay <= limits.ragSearchesPerDay) &&
      (limits.aiQueriesPerMonth === -1 || usage.aiQueriesPerMonth <= limits.aiQueriesPerMonth)
    ) {
      return planId as PlanId;
    }
  }
  
  return 'enterprise'; // If nothing matches, recommend enterprise
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null): string {
  if (price === null) return 'Custom';
  if (price === 0) return 'Free';
  return `$${price}`;
}

/**
 * Format limit for display
 */
export function formatLimit(limit: number): string {
  if (limit === -1) return 'Unlimited';
  if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}M`;
  if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`;
  return limit.toString();
}

