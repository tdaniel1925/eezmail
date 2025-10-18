-- Migration: Add admin roles and subscription tables
-- Date: 2025-10-18

-- Add role column to auth.users (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN role text DEFAULT 'user';
  END IF;
END $$;

-- Create subscriptions table for tracking user subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free', -- 'free', 'starter', 'professional', 'enterprise'
  status text NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing'
  processor text NOT NULL DEFAULT 'stripe', -- 'stripe' or 'square'
  processor_subscription_id text,
  processor_customer_id text,
  current_period_start timestamp,
  current_period_end timestamp,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamp,
  trial_start timestamp,
  trial_end timestamp,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create index on subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_processor_id ON subscriptions(processor_subscription_id);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  processor text NOT NULL, -- 'stripe' or 'square'
  processor_payment_method_id text NOT NULL,
  type text NOT NULL, -- 'card', 'bank_account'
  last4 text,
  brand text, -- 'visa', 'mastercard', etc
  exp_month int,
  exp_year int,
  is_default boolean DEFAULT false,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Create index on payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_processor_id ON payment_methods(processor_payment_method_id);

-- Create invoices table for tracking billing history
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  processor text NOT NULL,
  processor_invoice_id text NOT NULL UNIQUE,
  amount_due int NOT NULL, -- in cents
  amount_paid int NOT NULL, -- in cents
  currency text DEFAULT 'usd',
  status text NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'
  invoice_pdf text, -- URL to PDF
  hosted_invoice_url text, -- URL to hosted invoice page
  period_start timestamp,
  period_end timestamp,
  created_at timestamp DEFAULT now() NOT NULL,
  paid_at timestamp
);

-- Create index on invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_processor_id ON invoices(processor_invoice_id);

-- Create promotion_codes table
CREATE TABLE IF NOT EXISTS promotion_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  processor text NOT NULL, -- 'stripe' or 'square'
  processor_coupon_id text,
  discount_type text NOT NULL, -- 'percentage', 'fixed'
  discount_value int NOT NULL, -- percentage (0-100) or amount in cents
  max_redemptions int, -- null = unlimited
  redemptions_count int DEFAULT 0,
  expires_at timestamp,
  active boolean DEFAULT true,
  created_at timestamp DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index on promotion_codes
CREATE INDEX IF NOT EXISTS idx_promotion_codes_code ON promotion_codes(code);
CREATE INDEX IF NOT EXISTS idx_promotion_codes_active ON promotion_codes(active);

-- Create promotion_redemptions table
CREATE TABLE IF NOT EXISTS promotion_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_code_id uuid NOT NULL REFERENCES promotion_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  redeemed_at timestamp DEFAULT now() NOT NULL,
  UNIQUE(promotion_code_id, user_id)
);

-- Create index on promotion_redemptions
CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_promo ON promotion_redemptions(promotion_code_id);
CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_user ON promotion_redemptions(user_id);

-- Function to get monthly recurring revenue (MRR)
CREATE OR REPLACE FUNCTION get_mrr()
RETURNS TABLE (
  mrr numeric,
  active_subscriptions bigint,
  total_users bigint
)
LANGUAGE sql STABLE
AS $$
  WITH plan_prices AS (
    SELECT 'free' as tier, 0 as price
    UNION ALL SELECT 'starter', 15
    UNION ALL SELECT 'professional', 35
    UNION ALL SELECT 'enterprise', 99 -- Placeholder, actual is custom
  )
  SELECT
    COALESCE(SUM(pp.price), 0) as mrr,
    COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscriptions,
    COUNT(DISTINCT au.id) as total_users
  FROM auth.users au
  LEFT JOIN subscriptions s ON s.user_id = au.id
  LEFT JOIN plan_prices pp ON pp.tier = s.tier
  WHERE s.status IN ('active', 'trialing');
$$;

-- Function to get subscription stats by tier
CREATE OR REPLACE FUNCTION get_subscription_stats()
RETURNS TABLE (
  tier text,
  count bigint,
  percentage numeric
)
LANGUAGE sql STABLE
AS $$
  WITH tier_counts AS (
    SELECT
      COALESCE(s.tier, 'free') as tier,
      COUNT(*) as count
    FROM auth.users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    GROUP BY COALESCE(s.tier, 'free')
  ),
  total AS (
    SELECT SUM(count) as total_count FROM tier_counts
  )
  SELECT
    tc.tier,
    tc.count,
    ROUND((tc.count::numeric / t.total_count::numeric) * 100, 2) as percentage
  FROM tier_counts tc
  CROSS JOIN total t
  ORDER BY tc.count DESC;
$$;

-- Add comments for documentation
COMMENT ON TABLE subscriptions IS 'User subscription information synced from payment processors';
COMMENT ON TABLE payment_methods IS 'User payment methods stored securely via processors';
COMMENT ON TABLE invoices IS 'Billing history and invoice records';
COMMENT ON TABLE promotion_codes IS 'Promotional discount codes for subscriptions';
COMMENT ON TABLE promotion_redemptions IS 'Tracking of promotion code usage';
COMMENT ON FUNCTION get_mrr IS 'Calculate monthly recurring revenue and subscription metrics';
COMMENT ON FUNCTION get_subscription_stats IS 'Get subscription distribution by tier';

