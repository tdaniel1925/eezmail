-- Create proactive alerts table and enum
CREATE TYPE proactive_alert_type AS ENUM (
  'vip_email',
  'overdue_response',
  'meeting_prep',
  'urgent_keyword',
  'follow_up_needed',
  'deadline_approaching'
);

CREATE TABLE proactive_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Alert details
  type proactive_alert_type NOT NULL,
  priority priority NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  -- Action link
  action_url TEXT,
  action_label TEXT,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status
  dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_at TIMESTAMP,
  acted_upon BOOLEAN NOT NULL DEFAULT false,
  acted_upon_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX proactive_alerts_user_id_idx ON proactive_alerts(user_id);
CREATE INDEX proactive_alerts_type_idx ON proactive_alerts(type);
CREATE INDEX proactive_alerts_priority_idx ON proactive_alerts(priority);
CREATE INDEX proactive_alerts_dismissed_idx ON proactive_alerts(dismissed);
CREATE INDEX proactive_alerts_created_at_idx ON proactive_alerts(created_at);

-- Composite index for finding active alerts
CREATE INDEX proactive_alerts_active_idx ON proactive_alerts(user_id, dismissed, created_at DESC) 
WHERE dismissed = false;

-- Add comment
COMMENT ON TABLE proactive_alerts IS 'Stores proactive AI-generated alerts for users (VIP emails, overdue responses, meeting prep, etc.)';

