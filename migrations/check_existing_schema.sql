-- ============================================================
-- Check Existing Tables and Fix Missing Columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- First, let's see what columns exist in contact_timeline (if the table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_timeline'
  ) THEN
    RAISE NOTICE 'Table contact_timeline EXISTS. Checking columns...';
    
    -- Check if user_id column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'contact_timeline' 
      AND column_name = 'user_id'
    ) THEN
      RAISE NOTICE '❌ contact_timeline is missing user_id column';
    ELSE
      RAISE NOTICE '✅ contact_timeline has user_id column';
    END IF;
  ELSE
    RAISE NOTICE '❌ Table contact_timeline DOES NOT EXIST';
  END IF;
END $$;

-- Check email_settings table
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'email_settings'
  ) THEN
    RAISE NOTICE 'Table email_settings EXISTS. Checking columns...';
    
    -- Check if user_id column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'email_settings' 
      AND column_name = 'user_id'
    ) THEN
      RAISE NOTICE '❌ email_settings is missing user_id column';
    ELSE
      RAISE NOTICE '✅ email_settings has user_id column';
    END IF;
  ELSE
    RAISE NOTICE '❌ Table email_settings DOES NOT EXIST';
  END IF;
END $$;

-- Show all columns in contact_timeline if it exists
SELECT 
  'contact_timeline' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'contact_timeline'
ORDER BY ordinal_position;

-- Show all columns in email_settings if it exists
SELECT 
  'email_settings' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'email_settings'
ORDER BY ordinal_position;

