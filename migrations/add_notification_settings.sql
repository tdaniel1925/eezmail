-- Migration: Add notification_settings table
-- Purpose: Allow users to control which notifications they receive
-- Author: EaseMail Development Team
-- Date: 2025-01-27

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification category (e.g., 'sandbox_assignment', 'billing', 'security')
    category VARCHAR(50) NOT NULL,
    
    -- Whether this notification type is enabled
    enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Delivery channels
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT false,
    sms_enabled BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx 
    ON notification_settings(user_id);

CREATE INDEX IF NOT EXISTS notification_settings_category_idx 
    ON notification_settings(category);

-- Create unique index to prevent duplicate settings per user/category
CREATE UNIQUE INDEX IF NOT EXISTS notification_settings_user_category_idx 
    ON notification_settings(user_id, category);

-- Add comment to table
COMMENT ON TABLE notification_settings IS 'User notification preferences and delivery channel settings';

-- Add comments to columns
COMMENT ON COLUMN notification_settings.category IS 'Notification category (sandbox_assignment, billing, security, etc.)';
COMMENT ON COLUMN notification_settings.enabled IS 'Master switch for this notification type';
COMMENT ON COLUMN notification_settings.email_enabled IS 'Whether to send email notifications';
COMMENT ON COLUMN notification_settings.push_enabled IS 'Whether to send push notifications';
COMMENT ON COLUMN notification_settings.sms_enabled IS 'Whether to send SMS notifications';

-- Insert default notification settings for existing users (optional)
-- This ensures all users have default preferences
INSERT INTO notification_settings (user_id, category, enabled, email_enabled)
SELECT 
    id,
    'sandbox_assignment',
    true,
    true
FROM users
WHERE id NOT IN (
    SELECT user_id 
    FROM notification_settings 
    WHERE category = 'sandbox_assignment'
)
ON CONFLICT (user_id, category) DO NOTHING;

-- Grant permissions (adjust based on your RLS policies)
-- ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (uncomment if using RLS):
-- CREATE POLICY "Users can view their own notification settings"
--     ON notification_settings
--     FOR SELECT
--     USING (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own notification settings"
--     ON notification_settings
--     FOR UPDATE
--     USING (auth.uid() = user_id);

