-- Migration: Fix problematic indexes and add onboarding tables
-- Run this in Supabase SQL Editor

-- Step 1: Drop problematic unique indexes
DROP INDEX IF EXISTS public.idx_contact_groups_user_name;
DROP INDEX IF EXISTS public.idx_contact_tags_user_name;

-- Step 2: Create onboarding tables
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Phase 1: Essential Setup
  email_connected BOOLEAN NOT NULL DEFAULT FALSE,
  signature_configured BOOLEAN NOT NULL DEFAULT FALSE,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Phase 2: Quick Wins
  ai_reply_tried BOOLEAN NOT NULL DEFAULT FALSE,
  smart_inbox_viewed BOOLEAN NOT NULL DEFAULT FALSE,
  keyboard_shortcuts_learned BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Phase 3: Power User
  contacts_explored BOOLEAN NOT NULL DEFAULT FALSE,
  automation_created BOOLEAN NOT NULL DEFAULT FALSE,
  voice_feature_tried BOOLEAN NOT NULL DEFAULT FALSE,
  chatbot_used BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Meta
  current_phase INTEGER NOT NULL DEFAULT 1,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,
  last_viewed_step TEXT,
  dismissed_onboarding BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.onboarding_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.onboarding_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  tutorial_id TEXT NOT NULL,
  started BOOLEAN NOT NULL DEFAULT FALSE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  time_spent_seconds INTEGER DEFAULT 0
);

-- Success message
SELECT 'Migration completed successfully! Onboarding tables created.' AS status;




