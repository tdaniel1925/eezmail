-- =====================================================
-- MONITORING & ALERTING SYSTEM
-- Migration 014
-- =====================================================

-- Alert rules table
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    metric VARCHAR(100) NOT NULL, -- 'api_latency', 'error_rate', 'user_count', etc.
    operator VARCHAR(10) NOT NULL CHECK (operator IN ('gt', 'lt', 'eq', 'gte', 'lte')),
    threshold DECIMAL(20, 6) NOT NULL,
    duration_minutes INTEGER DEFAULT 5, -- Alert fires if condition persists for this duration
    severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    notification_channels JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['email', 'slack', 'webhook']
    enabled BOOLEAN DEFAULT true NOT NULL,
    last_triggered_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Alert events (history of triggered alerts)
CREATE TABLE IF NOT EXISTS alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMPTZ,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    metric_value DECIMAL(20, 6),
    metadata JSONB DEFAULT '{}'::jsonb,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ
);

-- System metrics (time-series data)
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(20, 6) NOT NULL,
    tags JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions for metrics (2025-2026)
CREATE TABLE system_metrics_2025_01 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE system_metrics_2025_02 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE system_metrics_2025_03 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE system_metrics_2025_04 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE system_metrics_2025_05 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE system_metrics_2025_06 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE system_metrics_2025_07 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE system_metrics_2025_08 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE system_metrics_2025_09 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE system_metrics_2025_10 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE system_metrics_2025_11 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE system_metrics_2025_12 PARTITION OF system_metrics
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Indexes
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled) WHERE enabled = true;
CREATE INDEX idx_alert_rules_metric ON alert_rules(metric);

CREATE INDEX idx_alert_events_rule ON alert_events(alert_rule_id);
CREATE INDEX idx_alert_events_triggered ON alert_events(triggered_at DESC);
CREATE INDEX idx_alert_events_unresolved ON alert_events(resolved_at) WHERE resolved_at IS NULL;

CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_timestamp ON system_metrics(timestamp DESC);
CREATE INDEX idx_system_metrics_name_timestamp ON system_metrics(metric_name, timestamp DESC);

-- Comments
COMMENT ON TABLE alert_rules IS 'Configurable alert rules for system monitoring';
COMMENT ON TABLE alert_events IS 'History of triggered alerts and their resolution status';
COMMENT ON TABLE system_metrics IS 'Time-series metrics data partitioned by timestamp';

