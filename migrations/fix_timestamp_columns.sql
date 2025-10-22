-- ============================================================================
-- FIX: Add missing assigned_at column to contact_tag_assignments
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_tag_assignments' AND column_name = 'assigned_at'
  ) THEN
    ALTER TABLE contact_tag_assignments 
    ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    
    RAISE NOTICE '✅ Added assigned_at column to contact_tag_assignments';
  ELSE
    RAISE NOTICE '✅ assigned_at column already exists';
  END IF;
END $$;

-- Also check contact_group_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_group_members' AND column_name = 'added_at'
  ) THEN
    ALTER TABLE contact_group_members 
    ADD COLUMN added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    
    RAISE NOTICE '✅ Added added_at column to contact_group_members';
  ELSE
    RAISE NOTICE '✅ added_at column already exists';
  END IF;
END $$;

SELECT '✅ Migration complete - contacts should now load!' as status;


