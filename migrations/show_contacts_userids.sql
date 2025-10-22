-- ============================================================================
-- SINGLE QUERY - ALL CONTACT INFO IN ONE TABLE
-- ============================================================================

SELECT 
  'CONTACT' as record_type,
  c.id as record_id,
  c.user_id,
  COALESCE(c.display_name, c.first_name || ' ' || c.last_name, 'No Name') as name,
  c.is_archived::text,
  c.source_type,
  c.created_at::text as created,
  ce.email as email_address
FROM contacts c
LEFT JOIN contact_emails ce ON c.id = ce.contact_id AND ce.is_primary = true
ORDER BY c.created_at DESC
LIMIT 20;


