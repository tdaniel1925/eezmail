-- Add First Name and Last Name Columns
-- This migration was applied manually in Supabase via migrations/ADD_FIRST_LAST_NAME_COLUMNS.sql

-- Add first_name and last_name columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Create indexes for first_name and last_name
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);

