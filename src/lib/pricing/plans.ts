/**
 * Simplified Pricing Plans
 *
 * Three-tier seat-based pricing model:
 * - Individual: $45/month (1 user, everything included)
 * - Team: $35/user/month (min 5 users, volume pricing)
 * - Enterprise: $25/user/month (6+ users, best value)
 *
 * All plans include unlimited features - SMS billed separately
 */

export const PLANS = {
  individual: {
    id: 'individual',
    name: 'Individual',
    price: 45,
    pricePerSeat: 45,
    interval: 'month' as const,
    stripeProductId: process.env.STRIPE_INDIVIDUAL_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_INDIVIDUAL_PRICE_ID,
    description: 'Everything you need to supercharge your inbox',
    minSeats: 1,
    maxSeats: 1,
    features: [
      'Unlimited email accounts',
      'Unlimited storage',
      'Full AI features (sentiment, summarization, writing assistance)',
      'Smart email categorization (Imbox/Feed/Paper Trail)',
      'Advanced search with RAG',
      'Contact intelligence & relationship scoring',
      'Email scheduling & templates',
      'Priority support',
      'All integrations included',
    ],
    highlighted: false,
  },
  team: {
    id: 'team',
    name: 'Team',
    price: 35,
    pricePerSeat: 35,
    interval: 'month' as const,
    stripeProductId: process.env.STRIPE_TEAM_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_TEAM_PRICE_ID,
    description: 'For growing teams (minimum 5 users)',
    minSeats: 5,
    maxSeats: null, // Unlimited
    features: [
      'Everything in Individual',
      'Team collaboration features',
      'Shared contacts & labels',
      'Team inbox management',
      'Admin controls & permissions',
      'Usage analytics & insights',
      'Bulk actions & automation',
      'SMS at cost (pay-as-you-go)',
      'Volume pricing ($35/user)',
    ],
    highlighted: true, // Most popular
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 25,
    pricePerSeat: 25,
    interval: 'month' as const,
    stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    description: 'For large organizations (6+ users)',
    minSeats: 6,
    maxSeats: null, // Unlimited
    features: [
      'Everything in Team',
      'Best value ($25/user)',
      'Custom AI models & training',
      'SSO & SAML authentication',
      'Advanced security controls',
      'API access for integrations',
      'White-label options',
      'Dedicated account manager',
      '24/7 premium support',
      'SLA guarantees',
      'Custom contracts available',
    ],
    highlighted: false,
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];

/**
 * Calculate subscription cost based on plan and seats
 */
export function calculateSubscriptionCost(
  planId: PlanId,
  seats: number
): number {
  const plan = PLANS[planId];

  // Individual: fixed $45 (always 1 seat)
  if (planId === 'individual') {
    return 45;
  }

  // Enforce minimum seats
  const actualSeats = Math.max(seats, plan.minSeats || 1);

  // Team: $35/user (min 5 users = $175)
  if (planId === 'team') {
    return actualSeats * 35;
  }

  // Enterprise: $25/user (min 6 users = $150)
  if (planId === 'enterprise') {
    return actualSeats * 25;
  }

  return 0;
}

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
 * Validate seat count for a plan
 */
export function validateSeats(
  planId: PlanId,
  seats: number
): { valid: boolean; error?: string; correctedSeats?: number } {
  const plan = PLANS[planId];

  if (seats < (plan.minSeats || 1)) {
    return {
      valid: false,
      error: `${plan.name} plan requires a minimum of ${plan.minSeats} ${plan.minSeats === 1 ? 'user' : 'users'}`,
      correctedSeats: plan.minSeats || 1,
    };
  }

  if (plan.maxSeats !== null && seats > plan.maxSeats) {
    return {
      valid: false,
      error: `${plan.name} plan has a maximum of ${plan.maxSeats} ${plan.maxSeats === 1 ? 'user' : 'users'}`,
      correctedSeats: plan.maxSeats,
    };
  }

  return { valid: true };
}

/**
 * Get recommended plan based on team size
 */
export function getRecommendedPlan(teamSize: number): PlanId {
  if (teamSize === 1) {
    return 'individual';
  }

  if (teamSize >= 6) {
    return 'enterprise'; // Best value for 6+ users
  }

  if (teamSize >= 5) {
    return 'team'; // Teams start at 5 users
  }

  // 2-4 users: recommend Individual for each OR suggest waiting for team plan
  return 'individual';
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null, seats?: number): string {
  if (price === null) return 'Custom';
  if (price === 0) return 'Free';

  if (seats && seats > 1) {
    return `$${price * seats}/mo for ${seats} users`;
  }

  return `$${price}/mo`;
}

/**
 * Format per-seat price for display
 */
export function formatPricePerSeat(plan: Plan): string {
  if (plan.pricePerSeat === 0) return 'Free';
  return `$${plan.pricePerSeat}/user/mo`;
}

/**
 * Get limit value for a specific feature in a plan
 */
export function getLimit(planId: PlanId, feature: string): number {
  // For the simplified pricing model, all plans include unlimited features
  // Return -1 for unlimited, or specific limits if needed
  return -1; // Unlimited for all features
}

/**
 * Format limit value for display
 */
export function formatLimit(limit: number): string {
  if (limit === -1 || limit === Infinity) return 'Unlimited';
  return limit.toLocaleString();
}
