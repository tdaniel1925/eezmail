-- Migration: Folder Structure Improvements (Phase 1)
-- Created: 2025-10-25
-- Description: Adds standardized folder types, display customization, and sync settings

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Core folder type enum for standardization across providers
CREATE TYPE core_folder_type AS ENUM (
  'inbox',
  'sent',
  'drafts',
  'trash',
  'spam',
  'archive',
  'starred',
  'important',
  'all_mail',
  'outbox',
  'custom'
);

-- ============================================================================
-- ALTER EMAIL_FOLDERS TABLE
-- ============================================================================

-- Add new standardized folder type (parallel to existing 'type' field)
ALTER TABLE email_folders
  ADD COLUMN IF NOT EXISTS folder_type core_folder_type DEFAULT 'custom';

-- Add system folder flag to distinguish built-in from user-created
ALTER TABLE email_folders
  ADD COLUMN IF NOT EXISTS is_system_folder BOOLEAN DEFAULT false;

-- Add display customization fields
ALTER TABLE email_folders
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'folder',
  ADD COLUMN IF NOT EXISTS color VARCHAR(7), -- Hex color
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999;

-- Add provider-specific fields
ALTER TABLE email_folders
  ADD COLUMN IF NOT EXISTS provider_path TEXT, -- Full IMAP path
  ADD COLUMN IF NOT EXISTS delimiter VARCHAR(10) DEFAULT '/'; -- Folder delimiter

-- Add per-folder sync settings
ALTER TABLE email_folders
  ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_frequency_minutes INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS sync_days_back INTEGER DEFAULT 30;

-- Add total size tracking
ALTER TABLE email_folders
  ADD COLUMN IF NOT EXISTS total_size_bytes BIGINT DEFAULT 0;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for quick folder type lookups
CREATE INDEX IF NOT EXISTS idx_email_folders_folder_type 
  ON email_folders(folder_type) 
  WHERE is_system_folder = true;

-- Index for sync-enabled folders
CREATE INDEX IF NOT EXISTS idx_email_folders_sync_enabled 
  ON email_folders(account_id, sync_enabled) 
  WHERE sync_enabled = true;

-- Index for sort order
CREATE INDEX IF NOT EXISTS idx_email_folders_sort_order 
  ON email_folders(account_id, sort_order);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Ensure only one folder of each system type per account
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_folders_unique_system_type
  ON email_folders(account_id, folder_type)
  WHERE is_system_folder = true;

-- ============================================================================
-- BACKFILL DATA
-- ============================================================================

-- Populate folder_type from existing 'type' field using smart mapping
UPDATE email_folders 
SET folder_type = (CASE 
  -- Inbox variations
  WHEN LOWER(type) = 'inbox' OR LOWER(name) = 'inbox' THEN 'inbox'
  
  -- Sent variations
  WHEN LOWER(type) LIKE '%sent%' 
    OR LOWER(name) LIKE '%sent%'
    OR LOWER(name) LIKE '%sent items%'
    OR LOWER(name) LIKE '%sent mail%'
    OR LOWER(name) LIKE '%sent messages%'
    THEN 'sent'
  
  -- Drafts variations
  WHEN LOWER(type) LIKE '%draft%' 
    OR LOWER(name) LIKE '%draft%'
    THEN 'drafts'
  
  -- Trash variations
  WHEN LOWER(type) LIKE '%trash%' 
    OR LOWER(type) LIKE '%deleted%'
    OR LOWER(name) LIKE '%trash%'
    OR LOWER(name) LIKE '%deleted%'
    OR LOWER(name) LIKE '%bin%'
    OR LOWER(name) = 'deleted items'
    THEN 'trash'
  
  -- Spam variations
  WHEN LOWER(type) LIKE '%spam%' 
    OR LOWER(type) LIKE '%junk%'
    OR LOWER(name) LIKE '%spam%'
    OR LOWER(name) LIKE '%junk%'
    OR LOWER(name) = 'junk email'
    OR LOWER(name) = 'bulk mail'
    THEN 'spam'
  
  -- Archive variations
  WHEN LOWER(type) LIKE '%archive%' 
    OR LOWER(type) LIKE '%all mail%'
    OR LOWER(name) LIKE '%archive%'
    OR LOWER(name) = 'all mail'
    THEN 'archive'
  
  -- Starred variations
  WHEN LOWER(type) LIKE '%starred%' 
    OR LOWER(type) LIKE '%flagged%'
    OR LOWER(name) LIKE '%starred%'
    OR LOWER(name) LIKE '%flagged%'
    THEN 'starred'
  
  -- Important variations
  WHEN LOWER(type) LIKE '%important%' 
    OR LOWER(name) LIKE '%important%'
    OR LOWER(name) LIKE '%priority%'
    THEN 'important'
  
  -- Outbox variations
  WHEN LOWER(type) LIKE '%outbox%' 
    OR LOWER(name) LIKE '%outbox%'
    THEN 'outbox'
  
  -- Everything else is custom
  ELSE 'custom'
END)::core_folder_type -- ✅ Cast to enum type
WHERE folder_type = 'custom'; -- Only update if not already set

-- Mark standard folders as system folders
UPDATE email_folders 
SET is_system_folder = true
WHERE folder_type IN ('inbox', 'sent', 'drafts', 'trash', 'spam', 'archive');

-- Set display names from existing names if not set
UPDATE email_folders 
SET display_name = name
WHERE display_name IS NULL;

-- Set appropriate icons based on folder type
UPDATE email_folders 
SET icon = CASE folder_type
  WHEN 'inbox' THEN 'inbox'
  WHEN 'sent' THEN 'send'
  WHEN 'drafts' THEN 'draft'
  WHEN 'trash' THEN 'delete'
  WHEN 'spam' THEN 'report'
  WHEN 'archive' THEN 'archive'
  WHEN 'starred' THEN 'star'
  WHEN 'important' THEN 'priority_high'
  WHEN 'all_mail' THEN 'all_inbox'
  WHEN 'outbox' THEN 'outbox'
  ELSE 'folder'
END
WHERE icon = 'folder'; -- Only update default icons

-- Set appropriate sort order
UPDATE email_folders 
SET sort_order = CASE folder_type
  WHEN 'inbox' THEN 1
  WHEN 'starred' THEN 2
  WHEN 'important' THEN 3
  WHEN 'sent' THEN 4
  WHEN 'drafts' THEN 5
  WHEN 'archive' THEN 6
  WHEN 'outbox' THEN 7
  WHEN 'spam' THEN 98
  WHEN 'trash' THEN 99
  WHEN 'all_mail' THEN 100
  ELSE 50
END
WHERE sort_order = 999; -- Only update default sort order

-- Set sync frequency based on folder importance
UPDATE email_folders 
SET sync_frequency_minutes = CASE folder_type
  WHEN 'inbox' THEN 5       -- Check every 5 minutes
  WHEN 'outbox' THEN 2      -- Check frequently for pending sends
  WHEN 'drafts' THEN 10
  WHEN 'starred' THEN 15
  WHEN 'important' THEN 10
  WHEN 'sent' THEN 15
  WHEN 'spam' THEN 30
  WHEN 'trash' THEN 60      -- Check infrequently
  WHEN 'archive' THEN 60
  WHEN 'all_mail' THEN 120
  ELSE 30                    -- Custom folders
END
WHERE sync_frequency_minutes = 15; -- Only update defaults

-- Set sync days back based on folder type
UPDATE email_folders 
SET sync_days_back = CASE folder_type
  WHEN 'inbox' THEN 30
  WHEN 'sent' THEN 30
  WHEN 'drafts' THEN 365    -- Keep all drafts
  WHEN 'starred' THEN 365   -- Keep all starred
  WHEN 'important' THEN 90
  WHEN 'trash' THEN 7       -- Only recent trash
  WHEN 'spam' THEN 7        -- Only recent spam
  WHEN 'archive' THEN 90
  WHEN 'all_mail' THEN 30
  WHEN 'outbox' THEN 1
  ELSE 30                    -- Custom folders
END
WHERE sync_days_back = 30; -- Only update defaults

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN email_folders.folder_type IS 'Standardized folder type across all providers';
COMMENT ON COLUMN email_folders.is_system_folder IS 'True for standard folders (inbox, sent, etc), false for user-created';
COMMENT ON COLUMN email_folders.display_name IS 'User-customizable display name';
COMMENT ON COLUMN email_folders.icon IS 'Icon identifier for UI (Material Icons or similar)';
COMMENT ON COLUMN email_folders.color IS 'Hex color code for folder (e.g., #FF4C5A)';
COMMENT ON COLUMN email_folders.sort_order IS 'Custom ordering (lower numbers appear first)';
COMMENT ON COLUMN email_folders.provider_path IS 'Full provider path (especially for IMAP nested folders)';
COMMENT ON COLUMN email_folders.delimiter IS 'Folder delimiter character (/ or .)';
COMMENT ON COLUMN email_folders.sync_enabled IS 'Whether to sync this folder';
COMMENT ON COLUMN email_folders.sync_frequency_minutes IS 'How often to sync this folder';
COMMENT ON COLUMN email_folders.sync_days_back IS 'How many days of history to sync';
COMMENT ON COLUMN email_folders.total_size_bytes IS 'Total size of all emails in this folder';

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Verify critical folders exist for each account
DO $$ 
DECLARE
  account_record RECORD;
  missing_inbox BOOLEAN;
BEGIN
  FOR account_record IN SELECT DISTINCT account_id FROM email_folders
  LOOP
    SELECT NOT EXISTS (
      SELECT 1 FROM email_folders 
      WHERE account_id = account_record.account_id 
      AND folder_type = 'inbox'
    ) INTO missing_inbox;
    
    IF missing_inbox THEN
      RAISE WARNING 'Account % is missing INBOX folder', account_record.account_id;
    END IF;
  END LOOP;
END $$;

