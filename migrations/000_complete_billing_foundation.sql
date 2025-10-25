-- Migration: Complete Multi-Tenant Billing Foundation
-- Creates ALL necessary tables for SMS + AI billing
-- Run this FIRST before other migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE MULTI-TENANT STRUCTURE
-- ============================================================================

-- Organizations (Master Accounts for businesses)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  
  -- Billing
  pricing_tier VARCHAR(50) DEFAULT 'standard',
  sms_balance DECIMAL(10, 2) DEFAULT 0.00,
  ai_balance DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Trial
  is_trial BOOLEAN DEFAULT false,
  trial_credits_used DECIMAL(10, 2) DEFAULT 0.00,
  trial_expires_at TIMESTAMP,
  
  -- Usage tracking
  sms_sent_count INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,
  
  -- Metadata
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_trial ON organizations(is_trial);

-- Organization Members (links users to organizations)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

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

CREATE INDEX IF NOT EXISTS idx_platform_admins_user ON platform_admins(user_id);

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
  ('ai_pricing_default', '{"rate_per_1k_tokens": 0.0020, "currency": "USD"}'::jsonb, 'Default AI rate per 1000 tokens'),
  ('trial_credits_default', '{"sms_amount": 5.00, "ai_amount": 10.00, "duration_days": 30}'::jsonb, 'Default trial credits for new signups')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- SMS BILLING
-- ============================================================================

-- SMS Pricing Overrides (per customer)
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

CREATE INDEX IF NOT EXISTS idx_pricing_overrides_org ON pricing_overrides(organization_id);
CREATE INDEX IF NOT EXISTS idx_pricing_overrides_user ON pricing_overrides(user_id);

-- SMS Trial Credits
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

CREATE INDEX IF NOT EXISTS idx_trial_credits_org ON trial_credits(organization_id);
CREATE INDEX IF NOT EXISTS idx_trial_credits_user ON trial_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_credits_status ON trial_credits(status);

-- ============================================================================
-- AI BILLING
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_ai_pricing_overrides_org ON ai_pricing_overrides(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_pricing_overrides_user ON ai_pricing_overrides(user_id);

-- AI Trial Credits
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

CREATE INDEX IF NOT EXISTS idx_ai_trial_credits_org ON ai_trial_credits(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_trial_credits_user ON ai_trial_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_trial_credits_status ON ai_trial_credits(status);

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  
  -- SMS
  sms_included INTEGER DEFAULT 0,
  overage_rate DECIMAL(6, 4),
  
  -- AI
  ai_tokens_included INTEGER DEFAULT 0,
  ai_overage_rate DECIMAL(8, 6),
  
  -- Features
  features JSONB DEFAULT '[]'::jsonb,
  max_users INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (
  name, plan_type, monthly_price, 
  sms_included, overage_rate,
  ai_tokens_included, ai_overage_rate,
  features, is_public
) VALUES
  ('Pay As You Go', 'individual', 0, 0, 0.0100, 10000, 0.0020, '["email_support"]'::jsonb, true),
  ('Basic', 'individual', 29, 1000, 0.0090, 50000, 0.0018, '["email_support", "analytics"]'::jsonb, true),
  ('Pro', 'individual', 99, 5000, 0.0080, 200000, 0.0015, '["priority_support", "analytics", "api_access"]'::jsonb, true),
  ('Business Starter', 'business', 99, 2000, 0.0090, 100000, 0.0018, '["email_support", "analytics", "5_users"]'::jsonb, true),
  ('Business Pro', 'business', 299, 10000, 0.0075, 500000, 0.0012, '["priority_support", "analytics", "api_access", "unlimited_users"]'::jsonb, true)
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
  
  -- SMS tracking
  sms_used_current_period INTEGER DEFAULT 0,
  sms_included_in_plan INTEGER DEFAULT 0,
  
  -- AI tracking
  ai_tokens_used_current_period INTEGER DEFAULT 0,
  ai_tokens_included_in_plan INTEGER DEFAULT 0,
  
  -- Payment
  stripe_subscription_id VARCHAR(255),
  square_subscription_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (
    (organization_id IS NOT NULL AND user_id IS NULL) OR
    (organization_id IS NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_customer_subs_org ON customer_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_subs_user ON customer_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_subs_status ON customer_subscriptions(status);

-- ============================================================================
-- USAGE TRACKING
-- ============================================================================

-- Communication Logs (SMS tracking)
CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID,
  
  -- Communication details
  type VARCHAR(50) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Billing
  billed_to VARCHAR(20),
  cost DECIMAL(6, 4),
  billing_status VARCHAR(20) DEFAULT 'pending',
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_logs_user ON communication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_comm_logs_org ON communication_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_comm_logs_type ON communication_logs(type);
CREATE INDEX IF NOT EXISTS idx_comm_logs_billing_status ON communication_logs(billing_status);
CREATE INDEX IF NOT EXISTS idx_comm_logs_timestamp ON communication_logs(timestamp);

-- AI Transactions
CREATE TABLE IF NOT EXISTS ai_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- AI Usage Details
  feature VARCHAR(100) NOT NULL,
  model VARCHAR(50) NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  
  -- Cost
  cost DECIMAL(10, 6) NOT NULL,
  billed_to VARCHAR(20),
  charged_from VARCHAR(20),
  
  -- Context
  email_id UUID,
  thread_id UUID,
  request_metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_transactions_user ON ai_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_org ON ai_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_feature ON ai_transactions(feature);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_created ON ai_transactions(created_at);

-- ============================================================================
-- ENHANCE USERS TABLE
-- ============================================================================

-- Add multi-tenant and billing fields to users
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='account_type') THEN
    ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'individual';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='organization_id') THEN
    ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pricing_tier') THEN
    ALTER TABLE users ADD COLUMN pricing_tier VARCHAR(50) DEFAULT 'standard';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='sms_balance') THEN
    ALTER TABLE users ADD COLUMN sms_balance DECIMAL(10, 2) DEFAULT 0.00;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ai_balance') THEN
    ALTER TABLE users ADD COLUMN ai_balance DECIMAL(10, 2) DEFAULT 0.00;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_trial') THEN
    ALTER TABLE users ADD COLUMN is_trial BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='trial_credits_used') THEN
    ALTER TABLE users ADD COLUMN trial_credits_used DECIMAL(10, 2) DEFAULT 0.00;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='trial_expires_at') THEN
    ALTER TABLE users ADD COLUMN trial_expires_at TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='sms_sent_count') THEN
    ALTER TABLE users ADD COLUMN sms_sent_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ai_tokens_used') THEN
    ALTER TABLE users ADD COLUMN ai_tokens_used INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);

-- ============================================================================
-- UNIFIED BALANCE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW customer_balances AS
SELECT 
  u.id as user_id,
  u.organization_id,
  COALESCE(o.name, u.full_name, u.email) as customer_name,
  
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

COMMENT ON TABLE organizations IS 'Master accounts for businesses (law firms, companies)';
COMMENT ON TABLE organization_members IS 'Links users to organizations with roles';
COMMENT ON TABLE platform_admins IS 'Platform administrators who manage pricing and customers';
COMMENT ON TABLE platform_settings IS 'Global platform configuration settings';
COMMENT ON TABLE pricing_overrides IS 'Custom SMS pricing for specific customers';
COMMENT ON TABLE ai_pricing_overrides IS 'Custom AI pricing for specific customers';
COMMENT ON TABLE trial_credits IS 'Free SMS trial credits granted to customers';
COMMENT ON TABLE ai_trial_credits IS 'Free AI trial credits granted to customers';
COMMENT ON TABLE subscription_plans IS 'Monthly subscription plans with included SMS and AI';
COMMENT ON TABLE customer_subscriptions IS 'Active customer subscriptions';
COMMENT ON TABLE communication_logs IS 'SMS and communication tracking for billing';
COMMENT ON TABLE ai_transactions IS 'Detailed AI usage logs for billing';
COMMENT ON VIEW customer_balances IS 'Unified view of customer SMS and AI balances';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Multi-tenant billing foundation created successfully!';
  RAISE NOTICE '📊 Created: organizations, organization_members, platform_admins';
  RAISE NOTICE '💰 Created: SMS + AI pricing, trial credits, subscription plans';
  RAISE NOTICE '📈 Created: communication_logs, ai_transactions, customer_balances view';
  RAISE NOTICE '👤 Enhanced: users table with billing fields';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '   1. Seed platform_admins with your user ID';
  RAISE NOTICE '   2. Test balance queries: SELECT * FROM customer_balances;';
  RAISE NOTICE '   3. Build platform admin dashboard';
END $$;

