-- Fix corrupted username for tdaniel@botmakers.ai
-- Date: October 28, 2025

UPDATE users 
SET username = 'tdaniel',
    updated_at = NOW()
WHERE email = 'tdaniel@botmakers.ai';

-- Verify the fix
SELECT 
    email,
    username,
    name,
    role
FROM users 
WHERE email = 'tdaniel@botmakers.ai';

