-- Username-Only Authentication Migration
-- This migration was applied manually in Supabase via migrations/USERNAME_ONLY_AUTH_MIGRATION.sql

-- Add username change token columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username_change_token TEXT,
ADD COLUMN IF NOT EXISTS username_change_token_expiry TIMESTAMP;

-- Add user status management columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Ensure username is NOT NULL and UNIQUE (if not already)
DO $$
BEGIN
  -- Make username NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'username' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE users ALTER COLUMN username SET NOT NULL;
  END IF;

  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_username_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users(is_suspended);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
CREATE INDEX IF NOT EXISTS idx_users_username_change_token ON users(username_change_token);

