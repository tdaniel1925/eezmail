-- Run this in Supabase SQL Editor to see what's happening with your account

-- 1. Check your Microsoft account details
SELECT 
    id,
    email_address,
    status,
    initial_sync_completed,
    last_sync_at,
    created_at
FROM email_accounts
WHERE provider = 'microsoft'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Count total emails
SELECT COUNT(*) as total_emails
FROM emails
WHERE account_id = (
    SELECT id FROM email_accounts WHERE provider = 'microsoft' ORDER BY created_at DESC LIMIT 1
);

-- 3. Check folders and their message counts
SELECT 
    name,
    message_count,
    unread_count,
    sync_status,
    last_sync_at,
    sync_cursor IS NOT NULL as has_delta_link
FROM email_folders
WHERE account_id = (
    SELECT id FROM email_accounts WHERE provider = 'microsoft' ORDER BY created_at DESC LIMIT 1
)
ORDER BY name;

-- 4. Check if deltaLinks are being saved (this is the problem!)
SELECT 
    name,
    CASE 
        WHEN sync_cursor IS NULL THEN 'NO DELTA LINK'
        WHEN sync_cursor LIKE '%delta%' THEN 'HAS DELTA LINK'
        WHEN sync_cursor LIKE '%nextLink%' THEN 'WRONG - HAS NEXTLINK'
        ELSE 'UNKNOWN'
    END as cursor_status,
    message_count
FROM email_folders
WHERE account_id = (
    SELECT id FROM email_accounts WHERE provider = 'microsoft' ORDER BY created_at DESC LIMIT 1
);

