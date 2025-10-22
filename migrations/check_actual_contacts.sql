-- ============================================================================
-- CHECK ACTUAL CONTACT DATA (No auth.uid() needed)
-- ============================================================================
-- This query shows the actual contacts without using auth.uid()
-- so we can see if they have user_id values
-- ============================================================================

SELECT 
  id,
  user_id,
  COALESCE(display_name, first_name || ' ' || last_name, 'No Name') as contact_name,
  first_name,
  last_name,
  company,
  is_archived,
  is_favorite,
  source_type,
  created_at,
  updated_at
FROM contacts
ORDER BY created_at DESC
LIMIT 10;

-- Also check contact emails
SELECT 
  'CONTACT EMAILS' as table_name,
  ce.contact_id,
  ce.email,
  ce.type,
  ce.is_primary,
  c.first_name,
  c.last_name
FROM contact_emails ce
LEFT JOIN contacts c ON ce.contact_id = c.id
ORDER BY ce.created_at DESC
LIMIT 10;


