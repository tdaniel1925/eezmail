-- ============================================================
-- Final Migration - Works with Your Existing Schema
-- ============================================================

-- 1. Create contact_timeline table (doesn't exist yet)
CREATE TABLE IF NOT EXISTS contact_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'email_sent', 'email_received', 'meeting', 'note', 'call', 'task'
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contact_timeline
CREATE INDEX IF NOT EXISTS idx_contact_timeline_user ON contact_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_contact ON contact_timeline(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_event_type ON contact_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_created ON contact_timeline(created_at DESC);

-- RLS for contact_timeline
ALTER TABLE contact_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own contact timeline" ON contact_timeline;
DROP POLICY IF EXISTS "Users can insert their own contact timeline" ON contact_timeline;
DROP POLICY IF EXISTS "Users can update their own contact timeline" ON contact_timeline;
DROP POLICY IF EXISTS "Users can delete their own contact timeline" ON contact_timeline;

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

-- 2. email_settings already exists with account_id (not user_id)
-- This is CORRECT for your schema! No changes needed.
-- Just ensure RLS is enabled

ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies that reference user_id (if any)
DROP POLICY IF EXISTS "Users can view their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can insert their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can update their own email settings" ON email_settings;
DROP POLICY IF EXISTS "Users can delete their own email settings" ON email_settings;

-- Create NEW policies that work with account_id
-- Users can access email_settings for accounts they own
CREATE POLICY "Users can view their account email settings"
  ON email_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_settings.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their account email settings"
  ON email_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_settings.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their account email settings"
  ON email_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_settings.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their account email settings"
  ON email_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_settings.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

-- ============================================================
-- Success!
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ============================================================';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Changes made:';
  RAISE NOTICE '   ✅ Created contact_timeline table';
  RAISE NOTICE '   ✅ Added indexes for contact_timeline';
  RAISE NOTICE '   ✅ Enabled RLS on contact_timeline';
  RAISE NOTICE '   ✅ Updated RLS policies for email_settings (account_id based)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Notes:';
  RAISE NOTICE '   - email_settings already exists (no changes to structure)';
  RAISE NOTICE '   - email_settings uses account_id (not user_id) - this is correct';
  RAISE NOTICE '   - contact_timeline uses user_id (standard pattern)';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Your app should now work without "missing tables" warnings!';
  RAISE NOTICE '============================================================';
END $$;

