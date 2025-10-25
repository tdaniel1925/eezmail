-- Migration: Add Platform Admin & Multi-Tenant Billing
-- Phase 1: Database Foundation
-- Run this migration to add platform admin controls and flexible pricing

-- ============================================================================
-- PLATFORM ADMINISTRATION
-- ============================================================================

-- Platform Admins (Your team)
CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'admin',
  permissions JSONB DEFAULT '{"view_all": true, "manage_pricing": true, "manage_organizations": true}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_platform_admins_user ON platform_admins(user_id);

-- Global Platform Settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('sms_pricing_default', '{"rate": 0.0100, "currency": "USD"}'::jsonb, 'Default SMS rate per message'),
  ('trial_credits_default', '{"amount": 5.00, "duration_days": 30}'::jsonb, 'Default trial credits for new signups'),
  ('subscription_plans_enabled', 'true'::jsonb, 'Enable subscription plans feature')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- FLEXIBLE PRICING SYSTEM
-- ============================================================================

-- Pricing Overrides (per customer)
CREATE TABLE IF NOT EXISTS pricing_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sms_rate DECIMAL(6, 4) NOT NULL,
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

CREATE INDEX idx_pricing_overrides_org ON pricing_overrides(organization_id);
CREATE INDEX idx_pricing_overrides_user ON pricing_overrides(user_id);

-- Trial Credits
CREATE TABLE IF NOT EXISTS trial_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credit_amount DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  remaining_balance DECIMAL(10, 2),
  granted_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (
    (organization_id IS NOT NULL AND user_id IS NULL) OR
    (organization_id IS NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX idx_trial_credits_org ON trial_credits(organization_id);
CREATE INDEX idx_trial_credits_user ON trial_credits(user_id);
CREATE INDEX idx_trial_credits_status ON trial_credits(status);

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  sms_included INTEGER DEFAULT 0,
  overage_rate DECIMAL(6, 4),
  features JSONB DEFAULT '[]'::jsonb,
  max_users INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, plan_type, monthly_price, sms_included, overage_rate, features, is_public) VALUES
  ('Pay As You Go', 'individual', 0, 0, 0.0100, '["email_support"]'::jsonb, true),
  ('Basic', 'individual', 29, 1000, 0.0090, '["email_support", "analytics"]'::jsonb, true),
  ('Pro', 'individual', 99, 5000, 0.0080, '["priority_support", "analytics", "api_access"]'::jsonb, true),
  ('Business Starter', 'business', 99, 2000, 0.0090, '["email_support", "analytics", "5_users"]'::jsonb, true),
  ('Business Pro', 'business', 299, 10000, 0.0075, '["priority_support", "analytics", "api_access", "unlimited_users"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Customer Subscriptions
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active',
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  sms_used_current_period INTEGER DEFAULT 0,
  sms_included_in_plan INTEGER DEFAULT 0,
  stripe_subscription_id VARCHAR(255),
  square_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (
    (organization_id IS NOT NULL AND user_id IS NULL) OR
    (organization_id IS NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX idx_customer_subs_org ON customer_subscriptions(organization_id);
CREATE INDEX idx_customer_subs_user ON customer_subscriptions(user_id);
CREATE INDEX idx_customer_subs_status ON customer_subscriptions(status);

-- ============================================================================
-- ENHANCE EXISTING TABLES
-- ============================================================================

-- Organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pricing_tier VARCHAR(50) DEFAULT 'standard';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_credits_used DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP;

-- Users (for individual accounts)
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual';
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pricing_tier VARCHAR(50) DEFAULT 'standard';
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_credits_used DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_balance DECIMAL(10, 2) DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);

-- Communication Logs (enhance for billing)
ALTER TABLE communication_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE communication_logs ADD COLUMN IF NOT EXISTS billed_to VARCHAR(20);
ALTER TABLE communication_logs ADD COLUMN IF NOT EXISTS cost DECIMAL(6, 4);
ALTER TABLE communication_logs ADD COLUMN IF NOT EXISTS billing_status VARCHAR(20) DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_comm_logs_org ON communication_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_comm_logs_billing_status ON communication_logs(billing_status);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE platform_admins IS 'Platform administrators who manage pricing and customers';
COMMENT ON TABLE platform_settings IS 'Global platform configuration settings';
COMMENT ON TABLE pricing_overrides IS 'Custom SMS pricing for specific customers';
COMMENT ON TABLE trial_credits IS 'Free trial credits granted to customers';
COMMENT ON TABLE subscription_plans IS 'Monthly subscription plans with included SMS';
COMMENT ON TABLE customer_subscriptions IS 'Active customer subscriptions';

