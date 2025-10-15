export const SQUARE_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    planId: null,
    features: [
      '1 email account',
      'Basic screening',
      '500 AI summaries/month',
      '3-day email history',
      'Community support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 15,
    planId: process.env.SQUARE_PLAN_ID_PRO_MONTHLY,
    features: [
      'Unlimited email accounts',
      'Unlimited AI features',
      'Full email history',
      'Advanced rules & automation',
      'Priority support',
      'Custom domains',
    ],
  },
  team: {
    name: 'Team',
    price: 12,
    planId: process.env.SQUARE_PLAN_ID_TEAM_MONTHLY,
    features: [
      'All Pro features',
      'Shared inboxes',
      'Team analytics',
      'Admin controls',
      'SSO integration',
      'Dedicated support',
    ],
    minSeats: 5,
  },
} as const;

export type PlanTier = keyof typeof SQUARE_PLANS;

export function getPlanByPlanId(planId: string): PlanTier | null {
  const entry = Object.entries(SQUARE_PLANS).find(
    ([, plan]) => plan.planId === planId
  );
  return entry ? (entry[0] as PlanTier) : null;
}
