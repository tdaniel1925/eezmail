-- ============================================================
-- SAFE Migration - Add Missing Tables/Columns
-- This checks what exists and only creates what's missing
-- ============================================================

-- 1. Create contact_timeline table if it doesn't exist
CREATE TABLE IF NOT EXISTS contact_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email', 'meeting', 'note', 'call', 'task'
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to contact_timeline if they don't exist
DO $$
BEGIN
  -- Add user_id if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_timeline' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE contact_timeline ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added user_id column to contact_timeline';
  END IF;

  -- Add title if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_timeline' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE contact_timeline ADD COLUMN title TEXT;
    RAISE NOTICE '✅ Added title column to contact_timeline';
  END IF;

  -- Add description if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_timeline' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE contact_timeline ADD COLUMN description TEXT;
    RAISE NOTICE '✅ Added description column to contact_timeline';
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_timeline' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE contact_timeline ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE '✅ Added updated_at column to contact_timeline';
  END IF;
END $$;

-- Indexes for contact_timeline
CREATE INDEX IF NOT EXISTS idx_contact_timeline_user ON contact_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_contact ON contact_timeline(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_type ON contact_timeline(type);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_created ON contact_timeline(created_at DESC);

-- ============================================================

-- 2. Create email_settings table if it doesn't exist
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
  undo_send_delay INTEGER DEFAULT 5,
  default_reply_behavior TEXT DEFAULT 'reply',
  
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

-- Add missing columns to email_settings if they don't exist
DO $$
BEGIN
  -- Add user_id if missing (and table uses account_id instead)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'email_settings' 
    AND column_name = 'user_id'
  ) THEN
    -- Check if account_id exists instead
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'email_settings' 
      AND column_name = 'account_id'
    ) THEN
      RAISE NOTICE '⚠️  email_settings uses account_id instead of user_id. This is OK - keeping existing structure.';
    ELSE
      ALTER TABLE email_settings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      RAISE NOTICE '✅ Added user_id column to email_settings';
    END IF;
  END IF;
END $$;

-- Index for email_settings
CREATE INDEX IF NOT EXISTS idx_email_settings_user ON email_settings(user_id);

-- ============================================================

-- 3. Row Level Security Policies
-- Enable RLS on both tables
ALTER TABLE contact_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for contact_timeline
DROP POLICY IF EXISTS "Users can view their own contact timeline" ON contact_timeline;
DROP POLICY IF EXISTS "Users can insert their own contact timeline" ON contact_timeline;
DROP POLICY IF EXISTS "Users can update their own contact timeline" ON contact_timeline;
DROP POLICY IF EXISTS "Users can delete their own contact timeline" ON contact_timeline;

-- Only create policies if user_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_timeline' 
    AND column_name = 'user_id'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own contact timeline" ON contact_timeline FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert their own contact timeline" ON contact_timeline FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update their own contact timeline" ON contact_timeline FOR UPDATE USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete their own contact timeline" ON contact_timeline FOR DELETE USING (auth.uid() = user_id)';
    RAISE NOTICE '✅ Created RLS policies for contact_timeline';
  ELSE
    RAISE NOTICE '⚠️  Skipped RLS policies for contact_timeline (no user_id column)';
  END IF;
END $$;

-- Drop and recreate policies for email_settings
DROP POLICY IF EXISTS "Users can view their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can insert their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can update their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can delete their own email settings" ON email_settings;

-- Only create policies if user_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'email_settings' 
    AND column_name = 'user_id'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own email settings" ON email_settings FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert their own email settings" ON email_settings FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update their own email settings" ON email_settings FOR UPDATE USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete their own email settings" ON email_settings FOR DELETE USING (auth.uid() = user_id)';
    RAISE NOTICE '✅ Created RLS policies for email_settings';
  ELSE
    RAISE NOTICE '⚠️  email_settings might use account_id - RLS policies may need custom setup';
  END IF;
END $$;

-- ============================================================

-- 4. Trigger Functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
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
-- Final Success Message
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ============================================================';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables checked/created:';
  RAISE NOTICE '   - contact_timeline';
  RAISE NOTICE '   - email_settings';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Row Level Security (RLS) enabled';
  RAISE NOTICE '⏰ Auto-update triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Check the NOTICES above for any warnings';
  RAISE NOTICE '============================================================';
END $$;

