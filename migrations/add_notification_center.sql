-- ============================================================================
-- NOTIFICATION CENTER MIGRATION
-- Adds persistent notification system for professional notification management
-- ============================================================================

-- Create notification type enum
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('success', 'error', 'warning', 'info');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notification category enum
DO $$ BEGIN
  CREATE TYPE notification_category AS ENUM (
    'email',
    'sync',
    'calendar',
    'contact',
    'task',
    'system',
    'account',
    'settings'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- NOTIFICATIONS TABLE
-- Stores all user notifications with actions and metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  type notification_type NOT NULL,
  category notification_category NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  
  -- Actions
  action_url TEXT, -- Link to related item (e.g., /dashboard/inbox?email=xyz)
  action_label TEXT, -- "View Email", "Retry Sync", "Open Contact"
  secondary_action_url TEXT, -- Optional second action
  secondary_action_label TEXT, -- "Undo", "Details", "Dismiss"
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- email_id, contact_id, sync_job_id, etc.
  related_entity_type TEXT, -- email, contact, event, task, etc.
  related_entity_id UUID, -- ID of related entity
  
  -- State
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  expires_at TIMESTAMP, -- Auto-delete after this time (optional)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  read_at TIMESTAMP,
  archived_at TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS notifications_user_category_idx ON notifications(user_id, category);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_expires_at_idx ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
DO $$ BEGIN
  CREATE POLICY notifications_select_own ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users can update their own notifications (mark read, archive)
DO $$ BEGIN
  CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users can delete their own notifications
DO $$ BEGIN
  CREATE POLICY notifications_delete_own ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- System can insert notifications for users
DO $$ BEGIN
  CREATE POLICY notifications_insert_system ON notifications
    FOR INSERT
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CLEANUP FUNCTION
-- Auto-delete expired notifications
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE notifications IS 'Persistent notification center for user notifications with actions';
COMMENT ON COLUMN notifications.type IS 'Visual type: success (green), error (red), warning (yellow), info (blue)';
COMMENT ON COLUMN notifications.category IS 'Feature category for filtering and organization';
COMMENT ON COLUMN notifications.action_url IS 'Primary action link (e.g., view email, open contact)';
COMMENT ON COLUMN notifications.metadata IS 'JSON data for rich notifications (email preview, contact info, etc.)';
COMMENT ON COLUMN notifications.expires_at IS 'Optional expiration time for auto-cleanup (e.g., temporary notifications)';

