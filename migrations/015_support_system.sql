-- =====================================================
-- SUPPORT TICKET SYSTEM
-- Migration 015
-- =====================================================

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number SERIAL UNIQUE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100), -- 'technical', 'billing', 'feature_request', etc.
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'open', 'pending', 'resolved', 'closed')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    sla_response_by TIMESTAMPTZ,
    sla_resolution_by TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ticket comments
CREATE TABLE IF NOT EXISTS ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_email VARCHAR(255),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false NOT NULL, -- Internal notes vs customer-visible
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ticket tags (for organization)
CREATE TABLE IF NOT EXISTS ticket_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT unique_ticket_tag UNIQUE (ticket_id, tag)
);

-- Indexes
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_support_tickets_org ON support_tickets(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_support_tickets_sla_response ON support_tickets(sla_response_by) WHERE sla_response_by IS NOT NULL;
CREATE INDEX idx_support_tickets_created ON support_tickets(created_at DESC);

CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_author ON ticket_comments(author_id) WHERE author_id IS NOT NULL;
CREATE INDEX idx_ticket_comments_created ON ticket_comments(created_at DESC);

CREATE INDEX idx_ticket_tags_ticket ON ticket_tags(ticket_id);
CREATE INDEX idx_ticket_tags_tag ON ticket_tags(tag);

-- Comments
COMMENT ON TABLE support_tickets IS 'Customer support tickets with SLA tracking';
COMMENT ON TABLE ticket_comments IS 'Comments and responses on support tickets';
COMMENT ON TABLE ticket_tags IS 'Tags for organizing and categorizing tickets';

-- Function to calculate SLA times
CREATE OR REPLACE FUNCTION calculate_sla_times(
    priority_level VARCHAR,
    created_time TIMESTAMPTZ
) RETURNS TABLE(response_by TIMESTAMPTZ, resolution_by TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE priority_level
            WHEN 'urgent' THEN created_time + INTERVAL '1 hour'
            WHEN 'high' THEN created_time + INTERVAL '4 hours'
            WHEN 'normal' THEN created_time + INTERVAL '24 hours'
            WHEN 'low' THEN created_time + INTERVAL '48 hours'
            ELSE created_time + INTERVAL '24 hours'
        END AS response_by,
        CASE priority_level
            WHEN 'urgent' THEN created_time + INTERVAL '4 hours'
            WHEN 'high' THEN created_time + INTERVAL '24 hours'
            WHEN 'normal' THEN created_time + INTERVAL '72 hours'
            WHEN 'low' THEN created_time + INTERVAL '168 hours'
            ELSE created_time + INTERVAL '72 hours'
        END AS resolution_by;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set SLA times on ticket creation
CREATE OR REPLACE FUNCTION set_ticket_sla_times()
RETURNS TRIGGER AS $$
DECLARE
    sla_times RECORD;
BEGIN
    SELECT * INTO sla_times FROM calculate_sla_times(NEW.priority, NEW.created_at);
    NEW.sla_response_by := sla_times.response_by;
    NEW.sla_resolution_by := sla_times.resolution_by;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_sla
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_sla_times();

