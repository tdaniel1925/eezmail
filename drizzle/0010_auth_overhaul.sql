-- Auth System Overhaul Migration
-- Created: 2025-10-27
-- Description: Adds hierarchical role system, permissions, username auth, and sandbox user features

-- ============================================================================
-- STEP 1: Create new enums (with idempotent handling)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('individual', 'business', 'team', 'enterprise', 'system');
EXCEPTION
  WHEN duplicate_object THEN 
    -- If it already exists, update it
    ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'team';
    ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'enterprise';
    ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'system';
END $$;

DO $$ BEGIN
  CREATE TYPE user_role_hierarchy AS ENUM (
    'user',
    'team_user',
    'team_admin',
    'team_super_admin',
    'enterprise_user',
    'enterprise_admin',
    'enterprise_super_admin',
    'system_admin',
    'system_super_admin'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Add new columns to users table (if they don't exist)
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS role_hierarchy user_role_hierarchy DEFAULT 'user';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_sandbox_user BOOLEAN DEFAULT false;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS sandbox_auto_generated_password BOOLEAN DEFAULT false;
END $$;

-- ============================================================================
-- STEP 3: Create permissions tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role_hierarchy NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (role, permission_id)
);

CREATE INDEX IF NOT EXISTS role_permission_idx ON role_permissions(role, permission_id);

CREATE TABLE IF NOT EXISTS user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id),
  granted BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE (user_id, permission_id)
);

CREATE INDEX IF NOT EXISTS user_permission_idx ON user_permission_overrides(user_id, permission_id);

-- ============================================================================
-- STEP 4: Seed default permissions
-- ============================================================================

INSERT INTO permissions (code, name, description, category) VALUES
  -- User Management
  ('can_view_users', 'View Users', 'Can view user list and profiles', 'users'),
  ('can_create_users', 'Create Users', 'Can create new users', 'users'),
  ('can_edit_users', 'Edit Users', 'Can edit user profiles', 'users'),
  ('can_delete_users', 'Delete Users', 'Can delete users', 'users'),
  ('can_manage_user_roles', 'Manage User Roles', 'Can assign and change user roles', 'users'),
  
  -- Billing & Subscriptions
  ('can_view_billing', 'View Billing', 'Can view billing information', 'billing'),
  ('can_manage_billing', 'Manage Billing', 'Can update payment methods and subscriptions', 'billing'),
  ('can_view_invoices', 'View Invoices', 'Can view invoice history', 'billing'),
  ('can_export_billing', 'Export Billing', 'Can export billing data', 'billing'),
  
  -- Settings
  ('can_view_settings', 'View Settings', 'Can view system settings', 'settings'),
  ('can_edit_settings', 'Edit Settings', 'Can modify system settings', 'settings'),
  ('can_manage_integrations', 'Manage Integrations', 'Can configure third-party integrations', 'settings'),
  
  -- Admin Panel
  ('can_access_admin', 'Access Admin Panel', 'Can access the admin dashboard', 'admin'),
  ('can_view_analytics', 'View Analytics', 'Can view system analytics', 'admin'),
  ('can_manage_sandbox', 'Manage Sandbox', 'Can create and manage sandbox companies', 'admin'),
  ('can_view_audit_logs', 'View Audit Logs', 'Can view system audit logs', 'admin'),
  ('can_manage_permissions', 'Manage Permissions', 'Can assign permissions to roles', 'admin'),
  
  -- Email Management
  ('can_view_emails', 'View Emails', 'Can view email accounts and messages', 'emails'),
  ('can_send_emails', 'Send Emails', 'Can send emails', 'emails'),
  ('can_manage_email_accounts', 'Manage Email Accounts', 'Can add/remove email accounts', 'emails')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 5: Seed default role-permission mappings
-- ============================================================================

-- Regular User permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'user', id FROM permissions WHERE code IN (
  'can_view_settings',
  'can_view_emails',
  'can_send_emails'
) ON CONFLICT DO NOTHING;

-- Team User permissions (inherit user + additional)
INSERT INTO role_permissions (role, permission_id)
SELECT 'team_user', id FROM permissions WHERE code IN (
  'can_view_settings',
  'can_view_emails',
  'can_send_emails',
  'can_manage_email_accounts'
) ON CONFLICT DO NOTHING;

-- Team Admin permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'team_admin', id FROM permissions WHERE code IN (
  'can_view_users',
  'can_create_users',
  'can_edit_users',
  'can_view_billing',
  'can_view_invoices',
  'can_view_settings',
  'can_edit_settings',
  'can_view_emails',
  'can_send_emails',
  'can_manage_email_accounts'
) ON CONFLICT DO NOTHING;

-- Team Super Admin permissions (full team control)
INSERT INTO role_permissions (role, permission_id)
SELECT 'team_super_admin', id FROM permissions WHERE code IN (
  'can_view_users',
  'can_create_users',
  'can_edit_users',
  'can_delete_users',
  'can_manage_user_roles',
  'can_view_billing',
  'can_manage_billing',
  'can_view_invoices',
  'can_export_billing',
  'can_view_settings',
  'can_edit_settings',
  'can_manage_integrations',
  'can_view_emails',
  'can_send_emails',
  'can_manage_email_accounts'
) ON CONFLICT DO NOTHING;

-- Enterprise User permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'enterprise_user', id FROM permissions WHERE code IN (
  'can_view_settings',
  'can_view_emails',
  'can_send_emails',
  'can_manage_email_accounts'
) ON CONFLICT DO NOTHING;

-- Enterprise Admin permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'enterprise_admin', id FROM permissions WHERE code IN (
  'can_view_users',
  'can_create_users',
  'can_edit_users',
  'can_view_billing',
  'can_view_invoices',
  'can_view_settings',
  'can_edit_settings',
  'can_manage_integrations',
  'can_view_emails',
  'can_send_emails',
  'can_manage_email_accounts',
  'can_view_analytics'
) ON CONFLICT DO NOTHING;

-- Enterprise Super Admin permissions (full enterprise control)
INSERT INTO role_permissions (role, permission_id)
SELECT 'enterprise_super_admin', id FROM permissions WHERE code IN (
  'can_view_users',
  'can_create_users',
  'can_edit_users',
  'can_delete_users',
  'can_manage_user_roles',
  'can_view_billing',
  'can_manage_billing',
  'can_view_invoices',
  'can_export_billing',
  'can_view_settings',
  'can_edit_settings',
  'can_manage_integrations',
  'can_view_emails',
  'can_send_emails',
  'can_manage_email_accounts',
  'can_view_analytics'
) ON CONFLICT DO NOTHING;

-- System Admin permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'system_admin', id FROM permissions WHERE code IN (
  'can_access_admin',
  'can_view_users',
  'can_create_users',
  'can_edit_users',
  'can_view_billing',
  'can_view_invoices',
  'can_view_settings',
  'can_edit_settings',
  'can_manage_sandbox',
  'can_view_analytics',
  'can_view_audit_logs',
  'can_view_emails',
  'can_send_emails',
  'can_manage_email_accounts'
) ON CONFLICT DO NOTHING;

-- System Super Admin permissions (ALL permissions)
INSERT INTO role_permissions (role, permission_id)
SELECT 'system_super_admin', id FROM permissions
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 6: Migrate existing user roles to new hierarchy
-- ============================================================================

UPDATE users SET role_hierarchy = 'system_super_admin' WHERE role = 'super_admin';
UPDATE users SET role_hierarchy = 'system_admin' WHERE role = 'admin';
UPDATE users SET role_hierarchy = 'user' WHERE role = 'sandbox_user';
UPDATE users SET role_hierarchy = 'user' WHERE role = 'user' AND role_hierarchy IS NULL;

-- ============================================================================
-- STEP 7: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
CREATE INDEX IF NOT EXISTS users_role_hierarchy_idx ON users(role_hierarchy);
CREATE INDEX IF NOT EXISTS users_is_sandbox_user_idx ON users(is_sandbox_user);
CREATE INDEX IF NOT EXISTS permissions_code_idx ON permissions(code);
CREATE INDEX IF NOT EXISTS permissions_category_idx ON permissions(category);

-- ============================================================================
-- STEP 8: Create super admin user (tdaniel1925)
-- ============================================================================

DO $$ 
DECLARE
  v_user_id UUID;
  v_user_exists BOOLEAN;
BEGIN
  -- Check if user already exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'tdaniel1925@easemail.com') INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    -- Create Supabase Auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'tdaniel1925@easemail.com',
      crypt('4Xkilla1@', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"tdaniel1925"}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE 'Created new auth user with ID: %', v_user_id;
  ELSE
    -- Get existing user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'tdaniel1925@easemail.com';
    RAISE NOTICE 'User already exists with ID: %', v_user_id;
  END IF;

  -- Create or update users table record
  INSERT INTO users (
    id,
    email,
    username,
    full_name,
    account_type,
    role_hierarchy,
    role,
    is_sandbox_user,
    subscription_tier,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'tdaniel1925@easemail.com',
    'tdaniel1925',
    'System Super Admin',
    'system',
    'system_super_admin',
    'super_admin',
    false,
    'enterprise',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = 'tdaniel1925',
    account_type = 'system',
    role_hierarchy = 'system_super_admin',
    role = 'super_admin',
    updated_at = NOW();
    
  RAISE NOTICE 'Super admin user setup complete!';
  RAISE NOTICE 'Username: tdaniel1925';
  RAISE NOTICE 'Email: tdaniel1925@easemail.com';
  RAISE NOTICE 'Password: 4Xkilla1@';
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Add comment to track migration
COMMENT ON TABLE permissions IS 'Auth overhaul migration - added 2025-10-27';

