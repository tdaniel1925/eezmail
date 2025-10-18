-- Migration: Add Contact Timeline Table
-- Date: 2025-10-18
-- Description: Adds contact_timeline table and contact_event_type enum for tracking contact interactions

-- Create enum for contact event types
CREATE TYPE contact_event_type AS ENUM (
  'email_sent',
  'email_received',
  'voice_message_sent',
  'voice_message_received',
  'note_added',
  'call_made',
  'meeting_scheduled',
  'document_shared',
  'contact_created',
  'contact_updated'
);

-- Create contact_timeline table
CREATE TABLE IF NOT EXISTS contact_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type contact_event_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS contact_timeline_contact_id_idx ON contact_timeline(contact_id);
CREATE INDEX IF NOT EXISTS contact_timeline_user_id_idx ON contact_timeline(user_id);
CREATE INDEX IF NOT EXISTS contact_timeline_event_type_idx ON contact_timeline(event_type);
CREATE INDEX IF NOT EXISTS contact_timeline_created_at_idx ON contact_timeline(created_at);

-- Note: contact_notes table already exists in the schema
-- If it doesn't exist in your database, uncomment and run the following:

-- CREATE TABLE IF NOT EXISTS contact_notes (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
--   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   content TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
-- );
-- 
-- CREATE INDEX IF NOT EXISTS contact_notes_contact_id_idx ON contact_notes(contact_id);
-- CREATE INDEX IF NOT EXISTS contact_notes_user_id_idx ON contact_notes(user_id);
-- CREATE INDEX IF NOT EXISTS contact_notes_created_at_idx ON contact_notes(created_at);



