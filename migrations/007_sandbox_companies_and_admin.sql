-- Migration: Add Sandbox Companies and Admin System
-- Created: 2025-10-25
-- Description: Adds support for sandbox companies with unlimited access and admin management

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User role enum
CREATE TYPE user_role AS ENUM (
  'user',
  'sandbox_user',
  'admin',
  'super_admin'
);

-- Sandbox company status enum
CREATE TYPE sandbox_company_status AS ENUM (
  'active',
  'suspended',
  'archived'
);

-- ============================================================================
-- ALTER USERS TABLE
-- ============================================================================

-- Add role and sandbox_company_id to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user' NOT NULL,
  ADD COLUMN IF NOT EXISTS sandbox_company_id UUID;

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_sandbox_company_id ON users(sandbox_company_id);

-- ============================================================================
-- SANDBOX COMPANIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status sandbox_company_status DEFAULT 'active' NOT NULL,
  
  -- Service Credentials (shared with sandbox users)
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  
  openai_api_key TEXT,
  openai_organization_id TEXT,
  
  -- Unlimited access flags
  unlimited_sms BOOLEAN DEFAULT TRUE NOT NULL,
  unlimited_ai BOOLEAN DEFAULT TRUE NOT NULL,
  unlimited_storage BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Usage tracking (for monitoring, not limiting)
  total_sms_used INTEGER DEFAULT 0,
  total_ai_tokens_used INTEGER DEFAULT 0,
  total_storage_used INTEGER DEFAULT 0,
  
  -- Contact info
  contact_email TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  
  -- Metadata
  notes TEXT,
  tags JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id)
);

-- Indexes for sandbox_companies
CREATE INDEX IF NOT EXISTS idx_sandbox_companies_status ON sandbox_companies(status);
CREATE INDEX IF NOT EXISTS idx_sandbox_companies_created_by ON sandbox_companies(created_by);
CREATE INDEX IF NOT EXISTS idx_sandbox_companies_name ON sandbox_companies(name);

-- ============================================================================
-- ADMIN AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  
  details JSONB,
  
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for admin_audit_log
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- ============================================================================
-- FOREIGN KEY CONSTRAINT
-- ============================================================================

-- Add foreign key from users.sandbox_company_id to sandbox_companies.id
ALTER TABLE users
  ADD CONSTRAINT fk_users_sandbox_company
  FOREIGN KEY (sandbox_company_id)
  REFERENCES sandbox_companies(id)
  ON DELETE SET NULL;

-- ============================================================================
-- UPDATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sandbox_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sandbox_companies
CREATE TRIGGER trigger_update_sandbox_companies_updated_at
  BEFORE UPDATE ON sandbox_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_sandbox_companies_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE sandbox_companies IS 'Companies with unlimited access for sandbox/demo users';
COMMENT ON TABLE admin_audit_log IS 'Audit trail for all admin actions';
COMMENT ON COLUMN users.role IS 'User role: user, sandbox_user, admin, or super_admin';
COMMENT ON COLUMN users.sandbox_company_id IS 'If user is a sandbox_user, links to their company';
COMMENT ON COLUMN sandbox_companies.unlimited_sms IS 'If true, sandbox users bypass SMS quotas';
COMMENT ON COLUMN sandbox_companies.unlimited_ai IS 'If true, sandbox users bypass AI token quotas';
COMMENT ON COLUMN sandbox_companies.unlimited_storage IS 'If true, sandbox users bypass storage limits';

