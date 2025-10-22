-- Check the actual columns in contact_tag_assignments table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contact_tag_assignments'
ORDER BY ordinal_position;


