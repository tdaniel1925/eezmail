-- Calendar Tables Migration
-- This migration adds comprehensive calendar functionality with external calendar sync support

-- Create Calendar Event Type Enum
CREATE TYPE calendar_event_type AS ENUM (
  'meeting',
  'task',
  'personal',
  'reminder',
  'all_day'
);

-- Create Calendar Event Status Enum
CREATE TYPE calendar_event_status AS ENUM (
  'confirmed',
  'tentative',
  'cancelled'
);

-- Create Attendee Response Status Enum
CREATE TYPE attendee_response_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'tentative'
);

-- Create Reminder Method Enum
CREATE TYPE reminder_method AS ENUM (
  'email',
  'push',
  'sms'
);

-- Create External Calendar Provider Enum
CREATE TYPE external_calendar_provider AS ENUM (
  'google',
  'microsoft',
  'apple',
  'other'
);

-- Create Sync Direction Enum
CREATE TYPE sync_direction AS ENUM (
  'pull',
  'push',
  'bidirectional'
);

-- ============================================================================
-- Calendar Events Table
-- ============================================================================

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  meeting_url TEXT,
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  is_all_day BOOLEAN DEFAULT false,
  
  -- Categorization
  type calendar_event_type NOT NULL DEFAULT 'meeting',
  status calendar_event_status DEFAULT 'confirmed',
  color TEXT DEFAULT 'blue',
  
  -- Recurrence (RRULE format per RFC 5545)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  recurrence_end_date TIMESTAMPTZ,
  parent_event_id UUID,
  
  -- Email Integration
  email_thread_id TEXT,
  email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  
  -- External Calendar Integration
  external_event_id TEXT,
  external_calendar_id TEXT,
  external_provider external_calendar_provider,
  
  -- Metadata
  created_by TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for Calendar Events
CREATE INDEX calendar_events_user_id_idx ON calendar_events(user_id);
CREATE INDEX calendar_events_start_time_idx ON calendar_events(start_time);
CREATE INDEX calendar_events_end_time_idx ON calendar_events(end_time);
CREATE INDEX calendar_events_email_thread_idx ON calendar_events(email_thread_id);
CREATE INDEX calendar_events_email_id_idx ON calendar_events(email_id);
CREATE INDEX calendar_events_external_id_idx ON calendar_events(external_event_id);
CREATE INDEX calendar_events_type_idx ON calendar_events(type);
CREATE INDEX calendar_events_status_idx ON calendar_events(status);

-- RLS Policies for Calendar Events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Calendar Attendees Table
-- ============================================================================

CREATE TABLE calendar_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  email TEXT NOT NULL,
  name TEXT,
  response_status attendee_response_status DEFAULT 'pending',
  is_organizer BOOLEAN DEFAULT false,
  is_optional BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for Calendar Attendees
CREATE INDEX calendar_attendees_event_id_idx ON calendar_attendees(event_id);
CREATE INDEX calendar_attendees_email_idx ON calendar_attendees(email);

-- RLS Policies for Calendar Attendees
ALTER TABLE calendar_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attendees of their calendar events"
  ON calendar_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.id = calendar_attendees.event_id
      AND calendar_events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage attendees of their calendar events"
  ON calendar_attendees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.id = calendar_attendees.event_id
      AND calendar_events.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Calendar Reminders Table
-- ============================================================================

CREATE TABLE calendar_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  minutes_before INTEGER NOT NULL,
  method reminder_method NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for Calendar Reminders
CREATE INDEX calendar_reminders_event_id_idx ON calendar_reminders(event_id);
CREATE INDEX calendar_reminders_sent_idx ON calendar_reminders(sent);

-- RLS Policies for Calendar Reminders
ALTER TABLE calendar_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage reminders for their calendar events"
  ON calendar_reminders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.id = calendar_reminders.event_id
      AND calendar_events.user_id = auth.uid()
    )
  );

-- ============================================================================
-- External Calendars Table
-- ============================================================================

CREATE TABLE external_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  provider external_calendar_provider NOT NULL,
  calendar_id TEXT NOT NULL,
  calendar_name TEXT,
  calendar_color TEXT,
  
  -- Sync settings
  sync_enabled BOOLEAN DEFAULT true,
  sync_direction sync_direction DEFAULT 'bidirectional',
  last_sync_at TIMESTAMPTZ,
  sync_token TEXT,
  next_sync_token TEXT,
  
  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for External Calendars
CREATE INDEX external_calendars_user_id_idx ON external_calendars(user_id);
CREATE INDEX external_calendars_provider_idx ON external_calendars(provider);
CREATE INDEX external_calendars_sync_enabled_idx ON external_calendars(sync_enabled);

-- RLS Policies for External Calendars
ALTER TABLE external_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own external calendars"
  ON external_calendars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own external calendars"
  ON external_calendars FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE calendar_events IS 'Stores all calendar events with support for recurring events, external calendar sync, and email integration';
COMMENT ON COLUMN calendar_events.recurrence_rule IS 'RRULE format per RFC 5545 for recurring events';
COMMENT ON COLUMN calendar_events.external_event_id IS 'ID of the event in external calendar system (Google, Microsoft, etc.)';
COMMENT ON COLUMN calendar_events.email_thread_id IS 'Links calendar event to email thread for context';

COMMENT ON TABLE calendar_attendees IS 'Stores attendees for calendar events with RSVP status tracking';
COMMENT ON TABLE calendar_reminders IS 'Stores reminders for calendar events with multi-channel support';
COMMENT ON TABLE external_calendars IS 'Manages connections to external calendar services like Google Calendar and Microsoft Calendar';

