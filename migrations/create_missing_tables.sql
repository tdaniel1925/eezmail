-- ============================================================
-- Create Missing Tables for easeMail
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Contact Timeline Table
-- Tracks all interactions with contacts (emails, meetings, notes, etc.)
CREATE TABLE IF NOT EXISTS contact_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email', 'meeting', 'note', 'call', 'task'
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Additional data (email_id, meeting_link, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contact_timeline
CREATE INDEX IF NOT EXISTS idx_contact_timeline_user ON contact_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_contact ON contact_timeline(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_type ON contact_timeline(type);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_created ON contact_timeline(created_at DESC);

-- Row Level Security for contact_timeline
ALTER TABLE contact_timeline ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own contact timeline" ON contact_timeline;
DROP POLICY IF EXISTS "Users can insert their own contact timeline" ON contact_timeline;
DROP POLICY IF EXISTS "Users can update their own contact timeline" ON contact_timeline;
DROP POLICY IF EXISTS "Users can delete their own contact timeline" ON contact_timeline;

-- Create policies
CREATE POLICY "Users can view their own contact timeline"
  ON contact_timeline FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact timeline"
  ON contact_timeline FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact timeline"
  ON contact_timeline FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact timeline"
  ON contact_timeline FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================

-- 2. Email Settings Table
-- Stores user-specific email preferences and settings
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Signature settings
  default_signature_id UUID,
  
  -- Auto-reply settings
  auto_reply_enabled BOOLEAN DEFAULT FALSE,
  auto_reply_subject TEXT,
  auto_reply_message TEXT,
  auto_reply_start_date TIMESTAMP WITH TIME ZONE,
  auto_reply_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Reading preferences
  mark_as_read_on_view BOOLEAN DEFAULT TRUE,
  auto_advance_on_delete BOOLEAN DEFAULT TRUE,
  conversation_view BOOLEAN DEFAULT TRUE,
  
  -- Sending preferences
  send_and_archive BOOLEAN DEFAULT FALSE,
  undo_send_delay INTEGER DEFAULT 5, -- seconds
  default_reply_behavior TEXT DEFAULT 'reply', -- 'reply' or 'reply-all'
  
  -- Notifications
  desktop_notifications BOOLEAN DEFAULT TRUE,
  sound_notifications BOOLEAN DEFAULT FALSE,
  
  -- Display preferences
  emails_per_page INTEGER DEFAULT 50,
  show_snippets BOOLEAN DEFAULT TRUE,
  compact_view BOOLEAN DEFAULT FALSE,
  
  -- AI preferences
  ai_suggestions_enabled BOOLEAN DEFAULT TRUE,
  ai_auto_categorize BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email_settings
CREATE INDEX IF NOT EXISTS idx_email_settings_user ON email_settings(user_id);

-- Row Level Security for email_settings
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can insert their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can update their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can delete their own email settings" ON email_settings;

-- Create policies
CREATE POLICY "Users can view their own email settings"
  ON email_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email settings"
  ON email_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email settings"
  ON email_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email settings"
  ON email_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================

-- 3. Trigger Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_contact_timeline_updated_at ON contact_timeline;
CREATE TRIGGER update_contact_timeline_updated_at
  BEFORE UPDATE ON contact_timeline
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_settings_updated_at ON email_settings;
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Success Message
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully created missing tables:';
  RAISE NOTICE '   - contact_timeline (for tracking contact interactions)';
  RAISE NOTICE '   - email_settings (for user email preferences)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Row Level Security (RLS) enabled on all tables';
  RAISE NOTICE '⏰ Auto-update triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Database schema is now complete!';
END $$;

