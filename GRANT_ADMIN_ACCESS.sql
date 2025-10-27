-- ============================================================================
-- GRANT ADMIN ACCESS TO USER
-- ============================================================================
-- Run this in your Supabase SQL Editor to grant admin access to your user
-- Replace 'tdaniel@botmakers.ai' with your email if different
-- ============================================================================

-- Option 1: Update existing user to admin role
UPDATE users 
SET role = 'admin'
WHERE email = 'tdaniel@botmakers.ai';

-- Option 2: If role column doesn't exist, add it first
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
-- UPDATE users SET role = 'admin' WHERE email = 'tdaniel@botmakers.ai';

-- Verify the update
SELECT id, email, role, full_name 
FROM users 
WHERE email = 'tdaniel@botmakers.ai';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '==============================================================';
  RAISE NOTICE 'ADMIN ACCESS GRANTED!';
  RAISE NOTICE '==============================================================';
  RAISE NOTICE 'User: tdaniel@botmakers.ai';
  RAISE NOTICE 'Role: admin';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now access:';
  RAISE NOTICE '  - /admin (Admin Dashboard)';
  RAISE NOTICE '  - /admin/knowledge-base';
  RAISE NOTICE '  - /admin/users';
  RAISE NOTICE '  - /admin/settings';
  RAISE NOTICE '  - /platform-admin (if super_admin)';
  RAISE NOTICE '==============================================================';
END $$;

