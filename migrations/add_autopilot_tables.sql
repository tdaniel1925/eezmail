-- Autopilot Tables Migration
-- Creates tables for email automation rules and execution history

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create autopilot_rules table
CREATE TABLE IF NOT EXISTS autopilot_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create autopilot_executions table
CREATE TABLE IF NOT EXISTS autopilot_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES autopilot_rules(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  user_correction TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_autopilot_rules_user_id 
  ON autopilot_rules(user_id);

CREATE INDEX IF NOT EXISTS idx_autopilot_rules_enabled 
  ON autopilot_rules(user_id, enabled) 
  WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_autopilot_executions_rule_id 
  ON autopilot_executions(rule_id);

CREATE INDEX IF NOT EXISTS idx_autopilot_executions_email_id 
  ON autopilot_executions(email_id);

CREATE INDEX IF NOT EXISTS idx_autopilot_executions_executed_at 
  ON autopilot_executions(executed_at DESC);

-- Enable Row Level Security
ALTER TABLE autopilot_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_executions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own rules" ON autopilot_rules;
DROP POLICY IF EXISTS "Users can create their own rules" ON autopilot_rules;
DROP POLICY IF EXISTS "Users can update their own rules" ON autopilot_rules;
DROP POLICY IF EXISTS "Users can delete their own rules" ON autopilot_rules;
DROP POLICY IF EXISTS "Users can view their rule executions" ON autopilot_executions;
DROP POLICY IF EXISTS "System can create executions" ON autopilot_executions;

-- Create RLS policies for autopilot_rules
CREATE POLICY "Users can view their own rules"
  ON autopilot_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rules"
  ON autopilot_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rules"
  ON autopilot_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rules"
  ON autopilot_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for autopilot_executions
CREATE POLICY "Users can view their rule executions"
  ON autopilot_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM autopilot_rules
      WHERE autopilot_rules.id = autopilot_executions.rule_id
      AND autopilot_rules.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create executions"
  ON autopilot_executions FOR INSERT
  WITH CHECK (true); -- Allow system to create execution records

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_autopilot_rules_updated_at ON autopilot_rules;

CREATE TRIGGER update_autopilot_rules_updated_at
  BEFORE UPDATE ON autopilot_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comment
COMMENT ON TABLE autopilot_rules IS 'Email automation rules created by users';
COMMENT ON TABLE autopilot_executions IS 'History of automated rule executions';


