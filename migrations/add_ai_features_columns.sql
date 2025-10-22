-- Add AI Features Database Schema
-- Run this in Supabase SQL Editor

-- Add security analysis column to emails
ALTER TABLE emails ADD COLUMN IF NOT EXISTS security_analysis JSONB;

-- Add autopilot execution log table
CREATE TABLE IF NOT EXISTS autopilot_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL,
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  user_correction TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Add analytics cache table
CREATE TABLE IF NOT EXISTS email_analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_autopilot_executions_user 
ON autopilot_executions(user_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_user 
ON email_analytics_cache(user_id, period_start);

CREATE INDEX IF NOT EXISTS idx_emails_security_analysis
ON emails USING GIN(security_analysis) WHERE security_analysis IS NOT NULL;

-- Analyze tables
ANALYZE autopilot_executions;
ANALYZE email_analytics_cache;
ANALYZE emails;

