-- =====================================================
-- IMPERSONATION SYSTEM
-- Migration 012
-- =====================================================

-- Impersonation sessions table
CREATE TABLE IF NOT EXISTS impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,
    read_only BOOLEAN DEFAULT false NOT NULL,
    actions_performed JSONB DEFAULT '[]' NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT valid_session CHECK (ended_at IS NULL OR ended_at > started_at),
    CONSTRAINT valid_token CHECK (char_length(session_token) >= 32)
);

-- Indexes for performance
CREATE INDEX idx_impersonation_admin ON impersonation_sessions(admin_id);
CREATE INDEX idx_impersonation_target ON impersonation_sessions(target_user_id);
CREATE INDEX idx_impersonation_token ON impersonation_sessions(session_token);
CREATE INDEX idx_impersonation_active ON impersonation_sessions(ended_at) 
    WHERE ended_at IS NULL;

-- Comments for documentation
COMMENT ON TABLE impersonation_sessions IS 'Tracks admin impersonation sessions for security and audit purposes';
COMMENT ON COLUMN impersonation_sessions.admin_id IS 'Admin user who initiated impersonation';
COMMENT ON COLUMN impersonation_sessions.target_user_id IS 'User being impersonated';
COMMENT ON COLUMN impersonation_sessions.reason IS 'Required justification for impersonation';
COMMENT ON COLUMN impersonation_sessions.session_token IS 'Secure token for session verification';
COMMENT ON COLUMN impersonation_sessions.read_only IS 'If true, only read operations are allowed';
COMMENT ON COLUMN impersonation_sessions.actions_performed IS 'Log of actions taken during impersonation';

