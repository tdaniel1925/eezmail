-- Seed Platform Admin
-- Run this to make yourself a platform admin

-- Step 1: Find your user ID
SELECT id, email, full_name 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 2: Copy your ID from above, then uncomment and run this:
-- (Replace the UUID below with YOUR actual user ID)

/*
INSERT INTO platform_admins (user_id, role, permissions)
VALUES (
  'PASTE-YOUR-USER-ID-HERE',  -- ← Replace this with your actual UUID
  'super_admin',
  '{"view_all": true, "manage_pricing": true, "manage_organizations": true, "manage_users": true}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  permissions = '{"view_all": true, "manage_pricing": true, "manage_organizations": true, "manage_users": true}'::jsonb;

-- Verify it worked
SELECT 
  pa.id,
  pa.role,
  u.email,
  u.full_name,
  pa.created_at
FROM platform_admins pa
JOIN users u ON pa.user_id = u.id;
*/

