# 🎯 System Monitoring - Complete Guide

**Date:** October 27, 2025  
**Status:** ✅ Fully Functional

---

## 📊 What is the Monitoring System?

The **System Monitoring** feature is your platform's health dashboard - a comprehensive real-time monitoring solution that tracks system performance, detects anomalies, and alerts admins when issues arise.

### **Core Purpose:**

Monitor and maintain the health of your email platform by:

1. **Tracking key metrics** (API latency, error rates, database performance)
2. **Detecting anomalies** automatically
3. **Alerting administrators** when thresholds are breached
4. **Visualizing trends** over time
5. **Preventing outages** through proactive monitoring

---

## 🚀 Key Features

### **1. Real-Time Dashboard** (`/admin/monitoring`)

#### **What You See:**

- **System Health Status** - Overall health indicator (Healthy/Warning/Critical)
- **Active Alerts Count** - Number of unresolved alerts
- **Critical Alerts** - High-priority issues requiring immediate attention
- **Active Rules** - Number of monitoring rules currently enabled

#### **Metric Charts:**

- **Response Time** - API latency trends
- **Error Rate** - System errors over time
- **Database Performance** - Query times and connection pooling
- **Memory Usage** - Server memory consumption
- **CPU Usage** - Processing load

#### **Active Alerts Panel:**

- List of current unresolved alerts
- Severity indicators (Critical/Warning/Info)
- Timestamp of when alert was triggered
- Quick actions to resolve or investigate

---

### **2. Alert Rules** (`/admin/monitoring/alerts`)

#### **Purpose:**

Configure automated monitoring rules that trigger alerts when specific conditions are met.

#### **Example Alert Rules:**

**High Error Rate Alert:**

```json
{
  "name": "High Error Rate",
  "metric": "error_rate",
  "operator": "greater_than",
  "threshold": 5,
  "severity": "critical",
  "enabled": true
}
```

- **Triggers when:** Error rate exceeds 5% of requests
- **Action:** Sends notification to admins
- **Use case:** Detect API failures or database issues

**API Latency Alert:**

```json
{
  "name": "Slow API Response",
  "metric": "api_latency",
  "operator": "greater_than",
  "threshold": 2000,
  "severity": "warning",
  "enabled": true
}
```

- **Triggers when:** API response time exceeds 2 seconds
- **Action:** Notify dev team
- **Use case:** Performance degradation detection

**Database Connection Alert:**

```json
{
  "name": "Database Connection Pool Exhausted",
  "metric": "db_connections",
  "operator": "greater_than",
  "threshold": 90,
  "severity": "critical",
  "enabled": true
}
```

- **Triggers when:** Database connections exceed 90% of pool size
- **Action:** Immediate admin notification
- **Use case:** Prevent connection exhaustion

---

## 🎯 How It Works

### **Data Collection:**

1. **System Metrics Collection**
   - Metrics are logged to the `system_metrics` table every minute
   - Tracks: API latency, error rates, DB performance, resource usage
   - Retention: Last 30 days (configurable)

2. **Alert Evaluation**
   - Every 5 minutes, the system evaluates all enabled alert rules
   - Compares current metrics against defined thresholds
   - Triggers alerts when conditions are met

3. **Alert Events**
   - When a rule is triggered, an `alert_event` is created
   - Event includes: severity, message, triggered_at timestamp
   - Alert remains active until resolved manually or auto-resolved

### **Database Schema:**

#### `system_metrics` Table:

```typescript
{
  id: uuid(PK);
  metric: string; // e.g., 'api_latency', 'error_rate'
  value: number;
  timestamp: timestamp;
  metadata: jsonb; // additional context
}
```

#### `alert_rules` Table:

```typescript
{
  id: uuid(PK);
  name: string;
  metric: string;
  operator: string; // 'greater_than', 'less_than', 'equals'
  threshold: number;
  severity: string; // 'info', 'warning', 'critical'
  enabled: boolean;
  lastTriggeredAt: timestamp(nullable);
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

#### `alert_events` Table:

```typescript
{
  id: uuid (PK)
  alertRuleId: uuid (FK → alert_rules.id)
  severity: string
  message: string
  triggeredAt: timestamp
  resolvedAt: timestamp (nullable)
  resolvedBy: uuid (FK → users.id)
}
```

---

## 🔧 Configuration

### **Available Metrics to Monitor:**

1. **`api_latency`** - Average API response time (ms)
2. **`error_rate`** - Percentage of failed requests
3. **`db_query_time`** - Database query execution time (ms)
4. **`db_connections`** - Active database connections
5. **`memory_usage`** - Server memory consumption (MB)
6. **`cpu_usage`** - CPU utilization percentage
7. **`email_sync_errors`** - Failed email sync operations
8. **`webhook_failures`** - Failed webhook deliveries
9. **`storage_usage`** - Attachment storage usage (GB)
10. **`active_users`** - Concurrent active users

### **Operators:**

- `greater_than` - Value exceeds threshold
- `less_than` - Value below threshold
- `equals` - Value matches exactly
- `not_equals` - Value doesn't match

### **Severity Levels:**

- **Info** 🔵 - Informational, no action needed
- **Warning** 🟡 - Attention required, but not urgent
- **Critical** 🔴 - Immediate action required

---

## 💡 Common Use Cases

### **1. Performance Monitoring**

**Alert:** "API response time > 2 seconds"
**Action:** Investigate slow queries, add caching, scale infrastructure

### **2. Error Rate Detection**

**Alert:** "Error rate > 5%"
**Action:** Check logs, identify failing endpoints, deploy hotfix

### **3. Resource Exhaustion**

**Alert:** "Database connections > 90%"
**Action:** Increase connection pool size, identify connection leaks

### **4. Email Sync Health**

**Alert:** "Email sync errors > 10 per hour"
**Action:** Check provider API status, review rate limits, debug sync logic

### **5. Storage Capacity**

**Alert:** "Storage usage > 80%"
**Action:** Archive old attachments, increase storage tier, implement cleanup

---

## 📈 Monitoring Best Practices

### **1. Set Meaningful Thresholds**

- **Too Low:** False positives, alert fatigue
- **Too High:** Miss critical issues
- **Recommendation:** Start conservative, adjust based on actual system behavior

### **2. Use Severity Appropriately**

- **Critical:** System down, data loss, security breach
- **Warning:** Performance degradation, approaching limits
- **Info:** Expected events, routine maintenance

### **3. Regular Review**

- Weekly: Review triggered alerts, adjust thresholds
- Monthly: Analyze trends, identify patterns
- Quarterly: Update rules based on system changes

### **4. Alert Escalation**

- Critical alerts → Immediate notification (SMS, Slack)
- Warning alerts → Email to dev team
- Info alerts → Dashboard only

---

## 🎨 UI/UX Features

### **Dark Mode Design:**

- ✅ Glassmorphic slate theme
- ✅ Color-coded severity badges
- ✅ Real-time updates
- ✅ Responsive charts

### **Quick Actions:**

- ✅ One-click alert resolution
- ✅ Jump to metrics detail view
- ✅ Create new alert rules inline
- ✅ Toggle rules on/off

---

## 🔌 API Endpoints

### **GET `/api/admin/monitoring`**

**Purpose:** Fetch monitoring dashboard data

**Returns:**

```json
{
  "stats": {
    "totalAlerts": 3,
    "criticalAlerts": 1,
    "activeRules": 12,
    "systemHealth": "warning"
  },
  "activeAlerts": [...],
  "recentMetrics": [...]
}
```

### **GET `/api/admin/monitoring/alerts`**

**Purpose:** Fetch alert rules

**Returns:**

```json
{
  "rules": [...],
  "stats": {
    "total": 15,
    "enabled": 12,
    "critical": 3,
    "triggered": 5
  }
}
```

---

## ✅ System Health Calculation

The system health indicator is calculated based on:

```typescript
function calculateSystemHealth(metrics) {
  const errorRate = countErrorMetrics / totalMetrics;

  if (errorRate > 0.1) return 'critical'; // 10%+ errors
  if (errorRate > 0.05) return 'warning'; // 5-10% errors
  return 'healthy'; // <5% errors
}
```

**Health Indicators:**

- 🟢 **Healthy** - All systems operational (< 5% error rate)
- 🟡 **Warning** - Some issues detected (5-10% error rate)
- 🔴 **Critical** - Major issues (> 10% error rate)

---

## 🚨 Alert Workflow

1. **Detection** → System continuously evaluates metrics against rules
2. **Trigger** → Alert event created when threshold breached
3. **Notification** → Admin notified via configured channels
4. **Investigation** → Admin reviews metrics and logs
5. **Resolution** → Issue fixed, alert manually resolved
6. **Post-mortem** → Adjust thresholds or add new rules

---

## 🎯 Key Benefits

1. **Proactive Issue Detection** - Catch problems before users notice
2. **Faster Resolution** - Immediate visibility into issues
3. **Historical Analysis** - Trend charts show patterns over time
4. **Capacity Planning** - Resource usage trends inform scaling decisions
5. **SLA Compliance** - Track uptime and performance metrics

---

## 📁 Files Created/Modified

### **Created:**

1. `src/app/admin/monitoring/page.tsx` - Main monitoring dashboard
2. `src/app/admin/monitoring/alerts/page.tsx` - Alert rules management
3. `src/app/api/admin/monitoring/route.ts` - Monitoring API
4. `src/app/api/admin/monitoring/alerts/route.ts` - Alerts API

### **Components:**

- `MetricsOverview` - Stats cards
- `ActiveAlerts` - Alert list
- `MetricCharts` - Time-series visualizations
- `AlertRulesTable` - Rules management table

---

## 🔒 Security

- ✅ Admin-only access
- ✅ Role-based authorization
- ✅ Audit logging for all changes
- ✅ Rate limiting on API endpoints

---

**Status: 100% Complete and Functional** ✅🎉

_Monitoring system is fully operational with dark mode, real-time updates, and comprehensive alerting!_
