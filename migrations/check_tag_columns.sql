-- Check the actual column name in contact_tag_assignments
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'contact_tag_assignments'
ORDER BY ordinal_position;


