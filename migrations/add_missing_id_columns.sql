-- ============================================================================
-- FIX: Add missing id column to contact_tag_assignments
-- ============================================================================

-- Check if id column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_tag_assignments' AND column_name = 'id'
  ) THEN
    -- Add id column
    ALTER TABLE contact_tag_assignments 
    ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    
    RAISE NOTICE '✅ Added id column to contact_tag_assignments';
  ELSE
    RAISE NOTICE '✅ id column already exists in contact_tag_assignments';
  END IF;
END $$;

-- Do the same for other tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_group_members' AND column_name = 'id'
  ) THEN
    ALTER TABLE contact_group_members 
    ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    
    RAISE NOTICE '✅ Added id column to contact_group_members';
  ELSE
    RAISE NOTICE '✅ id column already exists in contact_group_members';
  END IF;
END $$;

SELECT 'Migration complete' as status;


