-- Migration: Add Organization Fields to Users Table
-- Adds account_type, organization_id, and billing fields to users table

-- ============================================================================
-- ADD ACCOUNT TYPE ENUM
-- ============================================================================

-- Create account type enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('individual', 'business');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ADD MISSING COLUMNS TO USERS TABLE
-- ============================================================================

-- Add account_type column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_type account_type DEFAULT 'individual';

-- Add organization_id column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add billing balance columns for individual users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sms_balance DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_balance DECIMAL(10, 2) DEFAULT 0.00;

-- Add trial tracking columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP;

-- Add usage tracking columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sms_sent_count INTEGER DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_tokens_used INTEGER DEFAULT 0;

-- ============================================================================
-- ADD INDEXES
-- ============================================================================

-- Index for organization lookups
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Index for account type filtering
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

-- Index for trial accounts
CREATE INDEX IF NOT EXISTS idx_users_is_trial ON users(is_trial);

-- ============================================================================
-- VERIFY ORGANIZATIONS TABLE EXISTS
-- ============================================================================

-- This assumes organizations and organization_members were created by migration 000
-- If not, uncomment and run the tables below:

/*
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

CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON organization_members(user_id);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the migration
SELECT 
  COUNT(*) as user_count,
  COUNT(CASE WHEN account_type = 'individual' THEN 1 END) as individual_users,
  COUNT(CASE WHEN account_type = 'business' THEN 1 END) as business_users,
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as users_in_orgs
FROM users;

COMMENT ON COLUMN users.account_type IS 'Type of account: individual or business';
COMMENT ON COLUMN users.organization_id IS 'Organization ID if user is part of a business account';
COMMENT ON COLUMN users.sms_balance IS 'SMS balance for individual users (decimal)';
COMMENT ON COLUMN users.ai_balance IS 'AI token balance for individual users (decimal)';
COMMENT ON COLUMN users.is_trial IS 'Whether user is on a trial';
COMMENT ON COLUMN users.trial_expires_at IS 'When the trial expires';
COMMENT ON COLUMN users.sms_sent_count IS 'Total SMS messages sent';
COMMENT ON COLUMN users.ai_tokens_used IS 'Total AI tokens consumed';

