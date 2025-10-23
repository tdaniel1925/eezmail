-- ============================================================================
-- COMMUNICATION FEATURES MIGRATION (SIMPLIFIED - NO ALTER TYPE)
-- Adds SMS, voice call capabilities with rate limiting and monitoring
-- ============================================================================

-- Create plan type enum
DO $$ BEGIN
  CREATE TYPE communication_plan_type AS ENUM ('personal', 'professional', 'enterprise', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create communication type enum
DO $$ BEGIN
  CREATE TYPE communication_type AS ENUM ('sms', 'voice_call');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create communication status enum
DO $$ BEGIN
  CREATE TYPE communication_status AS ENUM ('sent', 'failed', 'rate_limited');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- COMMUNICATION SETTINGS TABLE
-- Stores user's Twilio configuration (encrypted credentials)
-- ============================================================================
CREATE TABLE IF NOT EXISTS communication_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  use_custom_twilio BOOLEAN DEFAULT false,
  billing_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS comm_settings_user_idx ON communication_settings(user_id);

-- ============================================================================
-- COMMUNICATION LIMITS TABLE
-- Rate limiting rules per user based on plan type
-- ============================================================================
CREATE TABLE IF NOT EXISTS communication_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type communication_plan_type DEFAULT 'personal',
  sms_per_minute INTEGER DEFAULT 1,
  sms_per_hour INTEGER DEFAULT 10,
  sms_per_day INTEGER DEFAULT 100,
  voice_per_minute INTEGER DEFAULT 1,
  voice_per_hour INTEGER DEFAULT 5,
  voice_per_day INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  override_by UUID REFERENCES users(id),
  notes TEXT, -- Admin notes about custom limits
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS comm_limits_user_idx ON communication_limits(user_id);
CREATE INDEX IF NOT EXISTS comm_limits_plan_idx ON communication_limits(plan_type);

-- ============================================================================
-- COMMUNICATION USAGE TABLE
-- Tracks all SMS and voice communications for monitoring and billing
-- ============================================================================
CREATE TABLE IF NOT EXISTS communication_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type communication_type NOT NULL,
  recipient_phone TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  status communication_status NOT NULL,
  cost DECIMAL(10, 4), -- Cost in dollars if using system Twilio
  used_custom_twilio BOOLEAN DEFAULT false,
  message_preview TEXT, -- First 50 chars of message
  error_message TEXT, -- If failed, store error
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast time-based queries
CREATE INDEX IF NOT EXISTS comm_usage_user_time_idx ON communication_usage(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS comm_usage_user_type_idx ON communication_usage(user_id, type);
CREATE INDEX IF NOT EXISTS comm_usage_status_idx ON communication_usage(status);
CREATE INDEX IF NOT EXISTS comm_usage_contact_idx ON communication_usage(contact_id);

-- ============================================================================
-- DEFAULT LIMITS FOR EXISTING USERS
-- Initialize limits for all existing users with 'personal' plan
-- ============================================================================
INSERT INTO communication_limits (user_id, plan_type)
SELECT id, 'personal'::communication_plan_type
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE communication_settings IS 'User Twilio configuration and billing preferences';
COMMENT ON TABLE communication_limits IS 'Rate limiting rules per user to prevent abuse';
COMMENT ON TABLE communication_usage IS 'Audit log of all SMS and voice communications';

COMMENT ON COLUMN communication_limits.sms_per_minute IS 'Personal: 1, Professional: 5, Enterprise: 20';
COMMENT ON COLUMN communication_limits.sms_per_day IS 'Personal: 100, Professional: 1000, Enterprise: 10000';
COMMENT ON COLUMN communication_usage.cost IS 'Cost charged to user if using system Twilio';

