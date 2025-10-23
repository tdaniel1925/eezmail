-- Migration: Add user AI profiles table for personality learning
-- This table stores learned writing style and communication patterns

CREATE TABLE IF NOT EXISTS user_ai_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Writing style analysis
  writing_style JSONB DEFAULT '{}'::jsonb, -- { tone, formality, wordChoicePatterns }
  common_phrases TEXT[] DEFAULT '{}', -- Frequently used phrases
  vocabulary_level TEXT DEFAULT 'moderate', -- simple/moderate/advanced
  avg_email_length INTEGER DEFAULT 200,
  greeting_style TEXT DEFAULT 'Hi', -- "Hi", "Hey", "Hello", etc.
  closing_style TEXT DEFAULT 'Best', -- "Best", "Thanks", "Cheers", etc.
  
  -- Communication patterns
  response_time_avg INTEGER DEFAULT 60, -- minutes
  active_hours JSONB DEFAULT '{"start": 9, "end": 17}'::jsonb, -- when user is most active
  preferred_tone TEXT DEFAULT 'professional', -- professional/casual/friendly
  emoji_usage BOOLEAN DEFAULT false,
  
  -- Behavioral patterns
  frequent_contacts TEXT[] DEFAULT '{}', -- top 20 contact IDs
  common_topics TEXT[] DEFAULT '{}', -- extracted topics
  meeting_frequency JSONB DEFAULT '{}'::jsonb, -- calendar patterns
  
  -- AI preferences
  learned_preferences JSONB DEFAULT '{}'::jsonb, -- detected preferences
  
  -- Analysis metadata
  last_analyzed_at TIMESTAMP DEFAULT NOW(),
  total_emails_analyzed INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS user_ai_profiles_user_id_idx ON user_ai_profiles(user_id);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_user_ai_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_user_ai_profiles_updated_at
BEFORE UPDATE ON user_ai_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_ai_profiles_updated_at();

COMMENT ON TABLE user_ai_profiles IS 'Stores learned user writing style and communication patterns for AI personalization';
COMMENT ON COLUMN user_ai_profiles.writing_style IS 'JSON object containing tone, formality, and word choice patterns';
COMMENT ON COLUMN user_ai_profiles.common_phrases IS 'Array of frequently used phrases extracted from sent emails';
COMMENT ON COLUMN user_ai_profiles.frequent_contacts IS 'Array of contact IDs for users most frequent correspondents';
COMMENT ON COLUMN user_ai_profiles.learned_preferences IS 'JSON object of detected user preferences and habits';

