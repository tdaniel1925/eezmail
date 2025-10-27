-- ============================================================================
-- Notification System Migration (Fixed for existing enums)
-- ============================================================================
-- This migration safely creates or updates the notification system tables
-- ============================================================================

-- Create notification template type enum (skip if exists)
DO $$ BEGIN
  CREATE TYPE notification_template_type AS ENUM ('transactional', 'marketing', 'system', 'sandbox');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notification audience enum (skip if exists)
DO $$ BEGIN
  CREATE TYPE notification_audience AS ENUM ('all', 'sandbox', 'individual', 'team', 'enterprise', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notification status enum (skip if exists)
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('draft', 'active', 'paused', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create email delivery status enum (skip if exists)
DO $$ BEGIN
  CREATE TYPE email_delivery_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type notification_template_type NOT NULL,
  audience notification_audience NOT NULL DEFAULT 'all',
  status notification_status NOT NULL DEFAULT 'draft',
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  preheader TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  personalization_rules JSONB DEFAULT '{}'::jsonb,
  from_name VARCHAR(100),
  from_email VARCHAR(255),
  reply_to_email VARCHAR(255),
  category VARCHAR(100),
  tags JSONB DEFAULT '[]'::jsonb,
  use_count INTEGER DEFAULT 0 NOT NULL,
  last_used_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create indexes for notification_templates
CREATE INDEX IF NOT EXISTS notification_templates_type_idx ON notification_templates(type);
CREATE INDEX IF NOT EXISTS notification_templates_audience_idx ON notification_templates(audience);
CREATE INDEX IF NOT EXISTS notification_templates_status_idx ON notification_templates(status);
CREATE INDEX IF NOT EXISTS notification_templates_category_idx ON notification_templates(category);

-- Create notification_queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES notification_templates(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '{}'::jsonb,
  status email_delivery_status DEFAULT 'pending' NOT NULL,
  delivery_attempts INTEGER DEFAULT 0 NOT NULL,
  last_attempt_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  external_id VARCHAR(255),
  external_status TEXT,
  error_message TEXT,
  error_code VARCHAR(50),
  scheduled_for TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create indexes for notification_queue
CREATE INDEX IF NOT EXISTS notification_queue_template_id_idx ON notification_queue(template_id);
CREATE INDEX IF NOT EXISTS notification_queue_recipient_id_idx ON notification_queue(recipient_id);
CREATE INDEX IF NOT EXISTS notification_queue_status_idx ON notification_queue(status);
CREATE INDEX IF NOT EXISTS notification_queue_scheduled_for_idx ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS notification_queue_sent_at_idx ON notification_queue(sent_at);

-- Create template_images table
CREATE TABLE IF NOT EXISTS template_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  url TEXT NOT NULL,
  storage_key TEXT,
  alt_text TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  use_count INTEGER DEFAULT 0 NOT NULL,
  used_in_templates JSONB DEFAULT '[]'::jsonb,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create indexes for template_images
CREATE INDEX IF NOT EXISTS template_images_uploaded_by_idx ON template_images(uploaded_by);
CREATE INDEX IF NOT EXISTS template_images_filename_idx ON template_images(filename);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  email_enabled BOOLEAN DEFAULT true NOT NULL,
  push_enabled BOOLEAN DEFAULT false NOT NULL,
  sms_enabled BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL,
  UNIQUE(user_id, category)
);

-- Create index for notification_settings
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON notification_settings(user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Notification system migration completed successfully!';
END $$;

