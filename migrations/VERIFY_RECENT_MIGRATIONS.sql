-- ============================================================================
-- VERIFICATION QUERY - Run this separately to check what was created
-- ============================================================================

SELECT 
  'Tables Check' as category,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_export_requests') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as data_export_requests,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_deletion_requests') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as data_deletion_requests,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_drafts') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as email_drafts

UNION ALL

SELECT 
  'Custom Folders Columns' as category,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_folders' AND column_name = 'icon') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as icon_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_folders' AND column_name = 'sort_order') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as sort_order_column,
  '' as placeholder;

