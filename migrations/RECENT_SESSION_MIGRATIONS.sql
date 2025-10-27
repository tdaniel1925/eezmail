-- ============================================================================
-- RECENT MIGRATIONS (Last 5 Hours)
-- Created: October 27, 2025
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. GDPR TABLES (for Privacy/GDPR Page)
-- ============================================================================

-- GDPR Data Export Requests Table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  download_url TEXT,
  error_message TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- GDPR Data Deletion Requests Table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  deletion_report JSONB,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_requested_at ON data_export_requests(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_requested_at ON data_deletion_requests(requested_at DESC);

-- ============================================================================
-- 2. EMAIL DRAFTS TABLE (for Draft Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  -- Email fields
  "to" TEXT,
  cc TEXT,
  bcc TEXT,
  subject TEXT,
  body TEXT, -- HTML content
  
  -- Attachments (stored as JSON array)
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Mode (hey_mode or traditional)
  mode TEXT DEFAULT 'traditional',
  
  -- Reply context
  reply_to_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  
  -- Timestamps
  last_saved TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for email drafts
CREATE INDEX IF NOT EXISTS idx_email_drafts_user_id ON email_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_account_id ON email_drafts(account_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_last_saved ON email_drafts(last_saved DESC);

-- ============================================================================
-- 3. CUSTOM FOLDERS ENHANCEMENTS (if needed)
-- ============================================================================

-- Check if custom_folders table needs icon and sort_order columns
DO $$
BEGIN
  -- Add icon column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_folders' AND column_name = 'icon'
  ) THEN
    ALTER TABLE custom_folders ADD COLUMN icon TEXT DEFAULT '📁';
  END IF;

  -- Add sort_order column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_folders' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE custom_folders ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index on sort_order
CREATE INDEX IF NOT EXISTS idx_custom_folders_sort_order ON custom_folders(user_id, sort_order);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check GDPR tables
SELECT 'GDPR Tables' as check_type, COUNT(*) as table_count
FROM information_schema.tables
WHERE table_name IN ('data_export_requests', 'data_deletion_requests');

-- Check email_drafts table
SELECT 'Email Drafts Table' as check_type, COUNT(*) as table_count
FROM information_schema.tables
WHERE table_name = 'email_drafts';

-- Check custom_folders enhancements
SELECT 'Custom Folders Columns' as check_type, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'custom_folders' AND column_name IN ('icon', 'sort_order');

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Recent migrations completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created/Updated:';
  RAISE NOTICE '  1. GDPR Tables (data_export_requests, data_deletion_requests)';
  RAISE NOTICE '  2. Email Drafts Table (email_drafts)';
  RAISE NOTICE '  3. Custom Folders Enhancements (icon, sort_order)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All indexes created for optimal performance';
END $$;

