-- Migration 0012: Add onboarding state tracking fields
-- This enables resume capability for incomplete onboarding flows
-- Run this in Supabase SQL Editor

-- Add onboarding step tracking
ALTER TABLE onboarding_progress 
ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'account_connection';

-- Add folders configured flag
ALTER TABLE onboarding_progress 
ADD COLUMN IF NOT EXISTS folders_configured BOOLEAN DEFAULT false NOT NULL;

-- Add last checkpoint timestamp
ALTER TABLE onboarding_progress 
ADD COLUMN IF NOT EXISTS last_checkpoint TIMESTAMP;

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'onboarding_progress'
AND column_name IN ('onboarding_step', 'folders_configured', 'last_checkpoint');
