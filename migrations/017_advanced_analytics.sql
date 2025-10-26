-- =====================================================
-- ADVANCED ANALYTICS SYSTEM
-- Migration 017
-- =====================================================

-- User Activity Events (Partitioned by timestamp)
CREATE TABLE IF NOT EXISTS user_activity_events (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'email_read', 'email_sent', 'contact_added', etc.
    event_data JSONB, -- Flexible event metadata
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions for 2025
CREATE TABLE user_activity_events_2025_10 PARTITION OF user_activity_events
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE user_activity_events_2025_11 PARTITION OF user_activity_events
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE user_activity_events_2025_12 PARTITION OF user_activity_events
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Create monthly partitions for 2026
CREATE TABLE user_activity_events_2026_01 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE user_activity_events_2026_02 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE user_activity_events_2026_03 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE user_activity_events_2026_04 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE user_activity_events_2026_05 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE user_activity_events_2026_06 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE user_activity_events_2026_07 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE user_activity_events_2026_08 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE user_activity_events_2026_09 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE user_activity_events_2026_10 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE user_activity_events_2026_11 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE user_activity_events_2026_12 PARTITION OF user_activity_events
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Indexes for activity events
CREATE INDEX idx_user_activity_user_id ON user_activity_events (user_id);
CREATE INDEX idx_user_activity_org_id ON user_activity_events (organization_id);
CREATE INDEX idx_user_activity_event_type ON user_activity_events (event_type);

-- =====================================================
-- COHORT ANALYSIS
-- =====================================================

CREATE TABLE IF NOT EXISTS cohort_analysis (
    cohort_month DATE NOT NULL PRIMARY KEY,
    users_count INTEGER NOT NULL DEFAULT 0,
    retention_month_1 DECIMAL(5, 2),
    retention_month_3 DECIMAL(5, 2),
    retention_month_6 DECIMAL(5, 2),
    retention_month_12 DECIMAL(5, 2),
    avg_revenue_per_user DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_cohort_month ON cohort_analysis (cohort_month DESC);

-- =====================================================
-- FEATURE USAGE STATS
-- =====================================================

CREATE TABLE IF NOT EXISTS feature_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    total_users INTEGER NOT NULL DEFAULT 0,
    active_users INTEGER NOT NULL DEFAULT 0,
    usage_count INTEGER NOT NULL DEFAULT 0,
    avg_session_duration INTEGER, -- In seconds
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(feature_name, date)
);

CREATE INDEX idx_feature_usage_name ON feature_usage_stats (feature_name);
CREATE INDEX idx_feature_usage_date ON feature_usage_stats (date DESC);

-- =====================================================
-- REVENUE ATTRIBUTION
-- =====================================================

CREATE TABLE IF NOT EXISTS revenue_attribution (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    revenue_amount DECIMAL(10, 2) NOT NULL,
    attribution_model VARCHAR(50) NOT NULL, -- 'first_touch', 'last_touch', 'linear'
    period_month DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_revenue_user_id ON revenue_attribution (user_id);
CREATE INDEX idx_revenue_org_id ON revenue_attribution (organization_id);
CREATE INDEX idx_revenue_feature ON revenue_attribution (feature_name);
CREATE INDEX idx_revenue_month ON revenue_attribution (period_month DESC);

-- =====================================================
-- CHURN PREDICTION
-- =====================================================

CREATE TABLE IF NOT EXISTS churn_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL,
    churn_probability DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    contributing_factors JSONB, -- Array of factors contributing to churn risk
    last_activity_date DATE,
    engagement_score DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, prediction_date)
);

CREATE INDEX idx_churn_user_id ON churn_predictions (user_id);
CREATE INDEX idx_churn_date ON churn_predictions (prediction_date DESC);
CREATE INDEX idx_churn_risk ON churn_predictions (risk_level);

-- =====================================================
-- CUSTOM REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS custom_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL, -- 'user_activity', 'revenue', 'engagement', etc.
    filters JSONB, -- Report filters
    metrics JSONB, -- Metrics to track
    schedule VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'on_demand'
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_custom_reports_created_by ON custom_reports (created_by);
CREATE INDEX idx_custom_reports_active ON custom_reports (is_active, next_run_at);

-- =====================================================
-- ANALYTICS AGGREGATIONS (Materialized View)
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_user_stats AS
SELECT
    user_id,
    DATE(timestamp) as activity_date,
    COUNT(*) as total_events,
    COUNT(DISTINCT event_type) as unique_event_types,
    jsonb_agg(DISTINCT event_type) as event_types,
    MIN(timestamp) as first_activity,
    MAX(timestamp) as last_activity,
    EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as session_duration
FROM user_activity_events
GROUP BY user_id, DATE(timestamp);

CREATE UNIQUE INDEX idx_daily_user_stats ON daily_user_stats (user_id, activity_date);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_daily_user_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_user_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Function to calculate retention
CREATE OR REPLACE FUNCTION calculate_retention(p_cohort_month DATE)
RETURNS TABLE(
    month_offset INTEGER,
    retained_users INTEGER,
    retention_rate DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH cohort AS (
        SELECT DISTINCT user_id
        FROM user_activity_events
        WHERE DATE_TRUNC('month', timestamp) = p_cohort_month
    ),
    subsequent_activity AS (
        SELECT
            c.user_id,
            DATE_TRUNC('month', e.timestamp) as activity_month,
            EXTRACT(MONTH FROM AGE(DATE_TRUNC('month', e.timestamp), p_cohort_month))::INTEGER as month_offset
        FROM cohort c
        JOIN user_activity_events e ON c.user_id = e.user_id
        WHERE DATE_TRUNC('month', e.timestamp) >= p_cohort_month
    )
    SELECT
        month_offset,
        COUNT(DISTINCT user_id)::INTEGER as retained_users,
        ROUND((COUNT(DISTINCT user_id)::DECIMAL / (SELECT COUNT(*) FROM cohort)) * 100, 2) as retention_rate
    FROM subsequent_activity
    GROUP BY month_offset
    ORDER BY month_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to track feature adoption
CREATE OR REPLACE FUNCTION track_feature_usage(
    p_feature_name VARCHAR(100),
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
BEGIN
    INSERT INTO feature_usage_stats (
        feature_name,
        date,
        total_users,
        active_users,
        usage_count,
        avg_session_duration
    )
    SELECT
        p_feature_name,
        p_date,
        (SELECT COUNT(DISTINCT id) FROM users),
        COUNT(DISTINCT user_id),
        COUNT(*),
        AVG(EXTRACT(EPOCH FROM (event_data->>'duration')::INTERVAL))::INTEGER
    FROM user_activity_events
    WHERE event_type = p_feature_name
      AND DATE(timestamp) = p_date
    ON CONFLICT (feature_name, date)
    DO UPDATE SET
        active_users = EXCLUDED.active_users,
        usage_count = EXCLUDED.usage_count,
        avg_session_duration = EXCLUDED.avg_session_duration;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE user_activity_events IS 'Tracks all user activity events for analytics';
COMMENT ON TABLE cohort_analysis IS 'Stores cohort retention analysis data';
COMMENT ON TABLE feature_usage_stats IS 'Daily feature usage statistics';
COMMENT ON TABLE revenue_attribution IS 'Revenue attribution by feature';
COMMENT ON TABLE churn_predictions IS 'ML-based churn risk predictions';
COMMENT ON TABLE custom_reports IS 'User-defined custom analytics reports';

