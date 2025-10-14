export type PaymentProcessor = 'stripe' | 'square';

export type SubscriptionTier = 'free' | 'pro' | 'team';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing';

export interface Plan {
  name: string;
  price: number;
  priceId: string | null;
  planId?: string | null;
  features: string[];
  minSeats?: number;
}

export interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  processor: PaymentProcessor;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}
