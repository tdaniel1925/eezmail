-- Migration: Add AI Credits Billing
-- Extends the platform billing system to include OpenAI/AI credits
-- Run AFTER 001_platform_admin_billing.sql

-- ============================================================================
-- AI CREDITS PRICING
-- ============================================================================

-- Add AI pricing to platform settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('ai_pricing_default', '{"rate_per_1k_tokens": 0.002, "currency": "USD"}'::jsonb, 'Default AI rate per 1000 tokens'),
  ('ai_credits_default', '{"amount": 10.00, "tokens": 5000}'::jsonb, 'Default AI credits for new signups')
ON CONFLICT (key) DO NOTHING;

-- AI Pricing Overrides (per customer)
CREATE TABLE IF NOT EXISTS ai_pricing_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rate_per_1k_tokens DECIMAL(8, 6) NOT NULL,
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_until TIMESTAMP,
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (
    (organization_id IS NOT NULL AND user_id IS NULL) OR
    (organization_id IS NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX idx_ai_pricing_overrides_org ON ai_pricing_overrides(organization_id);
CREATE INDEX idx_ai_pricing_overrides_user ON ai_pricing_overrides(user_id);

-- AI Credits (trial/promotional)
CREATE TABLE IF NOT EXISTS ai_trial_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credit_amount DECIMAL(10, 2) NOT NULL,
  tokens_included INTEGER,
  duration_days INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  remaining_balance DECIMAL(10, 2),
  tokens_used INTEGER DEFAULT 0,
  granted_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (
    (organization_id IS NOT NULL AND user_id IS NULL) OR
    (organization_id IS NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX idx_ai_trial_credits_org ON ai_trial_credits(organization_id);
CREATE INDEX idx_ai_trial_credits_user ON ai_trial_credits(user_id);
CREATE INDEX idx_ai_trial_credits_status ON ai_trial_credits(status);

-- ============================================================================
-- AI USAGE TRACKING
-- ============================================================================

-- AI Transactions (detailed usage logs)
CREATE TABLE IF NOT EXISTS ai_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User & Organization
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- AI Usage Details
  feature VARCHAR(100) NOT NULL, -- 'email_reply', 'summarize', 'classify', 'sentiment'
  model VARCHAR(50) NOT NULL, -- 'gpt-4o-mini', 'gpt-4o', etc.
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  
  -- Cost
  cost DECIMAL(10, 6) NOT NULL,
  billed_to VARCHAR(20), -- 'user' or 'organization'
  charged_from VARCHAR(20), -- 'trial', 'subscription', 'balance'
  
  -- Context
  email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  thread_id UUID,
  request_metadata JSONB, -- Original request details
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_transactions_user ON ai_transactions(user_id);
CREATE INDEX idx_ai_transactions_org ON ai_transactions(organization_id);
CREATE INDEX idx_ai_transactions_feature ON ai_transactions(feature);
CREATE INDEX idx_ai_transactions_created ON ai_transactions(created_at);

-- ============================================================================
-- ENHANCE SUBSCRIPTION PLANS
-- ============================================================================

-- Add AI credits to subscription plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS ai_tokens_included INTEGER DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS ai_overage_rate DECIMAL(8, 6);

-- Update existing plans with AI tokens
UPDATE subscription_plans SET 
  ai_tokens_included = 10000,
  ai_overage_rate = 0.0020
WHERE name = 'Pay As You Go';

UPDATE subscription_plans SET 
  ai_tokens_included = 50000,
  ai_overage_rate = 0.0018
WHERE name = 'Basic';

UPDATE subscription_plans SET 
  ai_tokens_included = 200000,
  ai_overage_rate = 0.0015
WHERE name = 'Pro';

UPDATE subscription_plans SET 
  ai_tokens_included = 100000,
  ai_overage_rate = 0.0018
WHERE name = 'Business Starter';

UPDATE subscription_plans SET 
  ai_tokens_included = 500000,
  ai_overage_rate = 0.0012
WHERE name = 'Business Pro';

-- ============================================================================
-- ENHANCE CUSTOMER SUBSCRIPTIONS
-- ============================================================================

-- Track AI usage in subscriptions
ALTER TABLE customer_subscriptions ADD COLUMN IF NOT EXISTS ai_tokens_used_current_period INTEGER DEFAULT 0;
ALTER TABLE customer_subscriptions ADD COLUMN IF NOT EXISTS ai_tokens_included_in_plan INTEGER DEFAULT 0;

-- ============================================================================
-- ENHANCE USERS & ORGANIZATIONS
-- ============================================================================

-- Add AI balance tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_balance DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_tokens_used INTEGER DEFAULT 0;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ai_balance DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ai_tokens_used INTEGER DEFAULT 0;

-- ============================================================================
-- COMBINED BALANCE VIEW
-- ============================================================================

-- Create a view for easy balance checking
CREATE OR REPLACE VIEW customer_balances AS
SELECT 
  u.id as user_id,
  u.organization_id,
  COALESCE(o.name, u.full_name) as customer_name,
  
  -- SMS Balance
  COALESCE(o.sms_balance, u.sms_balance, 0) as sms_balance,
  COALESCE(
    (SELECT remaining_balance FROM trial_credits 
     WHERE (organization_id = u.organization_id OR user_id = u.id) 
     AND status = 'active' 
     AND expires_at > NOW() 
     LIMIT 1),
    0
  ) as sms_trial_credits,
  
  -- AI Balance
  COALESCE(o.ai_balance, u.ai_balance, 0) as ai_balance,
  COALESCE(
    (SELECT remaining_balance FROM ai_trial_credits 
     WHERE (organization_id = u.organization_id OR user_id = u.id) 
     AND status = 'active' 
     AND expires_at > NOW() 
     LIMIT 1),
    0
  ) as ai_trial_credits,
  
  -- Subscription
  cs.plan_id,
  sp.name as plan_name,
  cs.sms_used_current_period,
  cs.sms_included_in_plan,
  cs.ai_tokens_used_current_period,
  cs.ai_tokens_included_in_plan,
  
  -- Account Type
  CASE WHEN u.organization_id IS NOT NULL THEN 'organization' ELSE 'individual' END as account_type
  
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN customer_subscriptions cs ON (
  (cs.organization_id = u.organization_id AND u.organization_id IS NOT NULL) OR
  (cs.user_id = u.id AND u.organization_id IS NULL)
)
LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_pricing_overrides IS 'Custom AI pricing for specific customers';
COMMENT ON TABLE ai_trial_credits IS 'Free trial AI credits granted to customers';
COMMENT ON TABLE ai_transactions IS 'Detailed AI usage logs for billing';
COMMENT ON VIEW customer_balances IS 'Unified view of customer SMS and AI balances';

