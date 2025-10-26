-- Migration: 018_folder_mapping_system.sql
-- Description: Add folder mapping system for user control over folder classifications
-- Author: AI Email Client Dev Team
-- Date: 2025-10-26

-- ============================================================================
-- FOLDER MAPPING SYSTEM
-- ============================================================================

-- User-defined folder mappings (overrides auto-detection)
CREATE TABLE IF NOT EXISTS folder_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  -- Provider folder info
  provider_folder_name TEXT NOT NULL, -- "Sent Items"
  provider_folder_id TEXT NOT NULL, -- External ID
  
  -- User's chosen mapping
  mapped_to_type TEXT NOT NULL CHECK (mapped_to_type IN (
    'inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 
    'starred', 'important', 'all_mail', 'outbox', 'custom'
  )),
  
  -- AI recommendation (for transparency)
  ai_recommendation TEXT CHECK (ai_recommendation IN (
    'inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 
    'starred', 'important', 'all_mail', 'outbox', 'custom'
  )),
  ai_confidence REAL CHECK (ai_confidence BETWEEN 0.0 AND 1.0), -- 0.0 - 1.0
  
  -- Mapping source
  mapping_source TEXT NOT NULL DEFAULT 'manual' CHECK (mapping_source IN ('auto', 'ai', 'manual')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one mapping per folder per account
  CONSTRAINT unique_folder_mapping UNIQUE (account_id, provider_folder_id)
);

-- Track unmapped folders needing attention
CREATE TABLE IF NOT EXISTS unmapped_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES email_folders(id) ON DELETE CASCADE,
  
  -- Folder details
  folder_name TEXT NOT NULL,
  folder_display_name TEXT,
  message_count INTEGER DEFAULT 0,
  
  -- AI recommendations (top 3) stored as JSONB
  -- Example: [{ "type": "sent", "confidence": 0.85, "reason": "Contains 'sent' keyword" }]
  recommendations JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'mapped', 'ignored')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Unique constraint: one unmapped entry per folder
  CONSTRAINT unique_unmapped_folder UNIQUE (folder_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_folder_mappings_user_id ON folder_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_folder_mappings_account_id ON folder_mappings(account_id);
CREATE INDEX IF NOT EXISTS idx_folder_mappings_provider_folder_id ON folder_mappings(provider_folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_mappings_mapped_to_type ON folder_mappings(mapped_to_type);

CREATE INDEX IF NOT EXISTS idx_unmapped_folders_user_id ON unmapped_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_unmapped_folders_account_id ON unmapped_folders(account_id);
CREATE INDEX IF NOT EXISTS idx_unmapped_folders_folder_id ON unmapped_folders(folder_id);
CREATE INDEX IF NOT EXISTS idx_unmapped_folders_status ON unmapped_folders(status);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get mapped folder type (with fallback to auto-detection)
CREATE OR REPLACE FUNCTION get_effective_folder_type(
  p_account_id UUID,
  p_provider_folder_id TEXT,
  p_auto_detected_type TEXT
) RETURNS TEXT AS $$
DECLARE
  v_mapped_type TEXT;
BEGIN
  -- Check for user-defined mapping first
  SELECT mapped_to_type INTO v_mapped_type
  FROM folder_mappings
  WHERE account_id = p_account_id
    AND provider_folder_id = p_provider_folder_id;
  
  -- Return mapped type if exists, otherwise fall back to auto-detected
  RETURN COALESCE(v_mapped_type, p_auto_detected_type);
END;
$$ LANGUAGE plpgsql;

-- Function to track unmapped folder
CREATE OR REPLACE FUNCTION track_unmapped_folder(
  p_user_id UUID,
  p_account_id UUID,
  p_folder_id UUID,
  p_folder_name TEXT,
  p_folder_display_name TEXT,
  p_message_count INTEGER,
  p_recommendations JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_unmapped_id UUID;
BEGIN
  -- Insert or update unmapped folder
  INSERT INTO unmapped_folders (
    user_id,
    account_id,
    folder_id,
    folder_name,
    folder_display_name,
    message_count,
    recommendations,
    status
  )
  VALUES (
    p_user_id,
    p_account_id,
    p_folder_id,
    p_folder_name,
    p_folder_display_name,
    p_message_count,
    p_recommendations,
    'pending'
  )
  ON CONFLICT (folder_id) DO UPDATE
  SET
    folder_name = EXCLUDED.folder_name,
    folder_display_name = EXCLUDED.folder_display_name,
    message_count = EXCLUDED.message_count,
    recommendations = EXCLUDED.recommendations,
    status = CASE 
      WHEN unmapped_folders.status = 'ignored' THEN 'ignored'
      ELSE 'pending'
    END
  RETURNING id INTO v_unmapped_id;
  
  RETURN v_unmapped_id;
END;
$$ LANGUAGE plpgsql;

-- Function to resolve unmapped folder (user mapped it)
CREATE OR REPLACE FUNCTION resolve_unmapped_folder(
  p_folder_id UUID,
  p_mapped_to_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE unmapped_folders
  SET
    status = 'mapped',
    resolved_at = NOW()
  WHERE folder_id = p_folder_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE folder_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmapped_folders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own folder mappings
CREATE POLICY folder_mappings_select_policy ON folder_mappings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY folder_mappings_insert_policy ON folder_mappings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY folder_mappings_update_policy ON folder_mappings
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY folder_mappings_delete_policy ON folder_mappings
  FOR DELETE
  USING (user_id = auth.uid());

-- Users can only see their own unmapped folders
CREATE POLICY unmapped_folders_select_policy ON unmapped_folders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY unmapped_folders_insert_policy ON unmapped_folders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY unmapped_folders_update_policy ON unmapped_folders
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY unmapped_folders_delete_policy ON unmapped_folders
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE folder_mappings IS 'User-defined folder type mappings that override automatic detection';
COMMENT ON TABLE unmapped_folders IS 'Folders that could not be automatically classified and need user input';

COMMENT ON COLUMN folder_mappings.provider_folder_name IS 'Original folder name from email provider (e.g., "Sent Items")';
COMMENT ON COLUMN folder_mappings.provider_folder_id IS 'External ID from email provider';
COMMENT ON COLUMN folder_mappings.mapped_to_type IS 'User-selected folder type';
COMMENT ON COLUMN folder_mappings.ai_recommendation IS 'AI-suggested folder type for transparency';
COMMENT ON COLUMN folder_mappings.ai_confidence IS 'Confidence score (0.0 - 1.0) for AI recommendation';
COMMENT ON COLUMN folder_mappings.mapping_source IS 'How mapping was created: auto (auto-detected), ai (AI suggestion accepted), manual (user override)';

COMMENT ON COLUMN unmapped_folders.recommendations IS 'Top 3 AI recommendations with confidence scores and reasoning';
COMMENT ON COLUMN unmapped_folders.status IS 'pending (awaiting user input), mapped (user mapped it), ignored (user chose to ignore)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 018_folder_mapping_system.sql completed successfully!';
  RAISE NOTICE '   - Created folder_mappings table';
  RAISE NOTICE '   - Created unmapped_folders table';
  RAISE NOTICE '   - Added indexes for performance';
  RAISE NOTICE '   - Created helper functions';
  RAISE NOTICE '   - Enabled Row Level Security';
END $$;

