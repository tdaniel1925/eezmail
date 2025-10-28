# 📚 EaseMail Admin User Guide

**Version:** 1.0  
**Last Updated:** October 28, 2025  
**For:** Admin Panel v2.0

---

## 🎯 Quick Start

Welcome to the EaseMail Admin Panel! This guide will help you navigate and use all 39 admin pages effectively.

### How to Access

1. Log in with your admin credentials at: `https://easemail.app/login`
2. Navigate to: `https://easemail.app/admin`
3. You'll see the admin sidebar with 4 main sections

### Admin Sidebar Navigation

```
📊 Main (7 pages)
├─ Dashboard
├─ Users
├─ Customers
├─ Sales
├─ Subscriptions
├─ Promotions
└─ Analytics

🔧 Debug Tools (4 pages)
├─ Sync Jobs
├─ Connection Test
├─ Logs
└─ Profiler

🧪 Beta Program (5 pages)
├─ Beta Dashboard
├─ Beta Users
├─ Feedback
├─ AI Insights
└─ Analytics

⚙️ System (11 pages)
├─ Permissions
├─ Email Templates
├─ Email Accounts
├─ Notification Templates
├─ Features
├─ Pricing
├─ Privacy
├─ Support
├─ Knowledge Base
├─ Monitoring
└─ Audit Logs
```

---

## 📊 MAIN SECTION

### 1. Dashboard (`/admin`)

**Purpose:** Overview of platform health and key metrics

**What You'll See:**

- Total users count
- Active subscriptions
- Revenue metrics
- Recent activity feed
- Quick action buttons

**Key Actions:**

- View system health at a glance
- Access recent user signups
- Monitor revenue trends
- Quick links to common tasks

**Tips:**

- Refresh dashboard every morning to check system status
- Watch for anomalies in user activity
- Monitor subscription growth trends

---

### 2. Users (`/admin/users`)

**Purpose:** Manage all user accounts

**What You'll See:**

- Searchable user list with filters
- User details (email, name, role, tier)
- Account status (active, suspended, deleted)
- Quick actions menu

**Key Actions:**

- **Search Users:** Type name, email, or username in search bar
- **Filter Users:** By role, tier, status, account type
- **View User Details:** Click on any user row
- **Add New User:** Click "Add User" button (top right)
- **Edit User:** Click edit icon in actions column
- **Suspend User:** Click suspend icon (use cautiously!)
- **Delete User:** Click delete icon (requires confirmation)

**User Detail View (`/admin/users/[id]`):**

- Full user profile
- Email accounts connected
- Subscription details
- Usage statistics (SMS, AI credits)
- Activity timeline
- Permission overrides

**Adding a New User:**

1. Click "Add User" button
2. Fill in required fields:
   - Full Name
   - Email
   - Username (auto-generated or custom)
   - Role (user/admin/etc.)
   - Tier (individual/team/enterprise)
   - Account Type (paid/trial/beta)
3. Optional: Set custom permissions
4. Click "Create User"
5. User receives welcome email with credentials

**Tips:**

- Use bulk actions for managing multiple users
- Export user list to CSV for reporting
- Set up saved filters for common user segments
- Always verify email before suspending accounts

---

### 3. Customers (`/admin/customers`)

**Purpose:** View and manage customer accounts and billing

**What You'll See:**

- Customer list with payment status
- Lifetime value (LTV)
- Current plan and billing cycle
- Payment method status
- Overdue payments highlighted

**Key Actions:**

- View customer billing history
- Process manual charges
- Issue refunds
- Update payment methods
- View customer support tickets

**Customer Detail View (`/admin/customers/[id]`):**

- Subscription timeline
- Payment history
- Invoices (downloadable PDFs)
- Support ticket history
- Usage metrics

**Tips:**

- Monitor "Payment Failed" status and reach out proactively
- Use customer segments for targeted campaigns
- Track LTV trends for pricing optimization

---

### 4. Sales (`/admin/sales`)

**Purpose:** Track sales performance and revenue metrics

**What You'll See:**

- Revenue charts (daily, weekly, monthly)
- Sales by product/tier
- Conversion funnel
- Top performing products
- Sales forecast

**Key Metrics:**

- **MRR (Monthly Recurring Revenue):** Predictable monthly income
- **ARR (Annual Recurring Revenue):** MRR × 12
- **Churn Rate:** % of customers canceling
- **ARPU (Average Revenue Per User):** Total revenue ÷ active users
- **LTV (Lifetime Value):** Average customer lifetime revenue

**Key Actions:**

- Export sales reports (CSV, PDF)
- Filter by date range
- Compare periods (month-over-month, year-over-year)
- View sales by channel (direct, referral, etc.)

**Tips:**

- Check MRR growth every Monday
- Monitor churn rate weekly
- Set up automated reports for stakeholders
- Track seasonal trends for planning

---

### 5. Subscriptions (`/admin/subscriptions`)

**Purpose:** Manage all subscription plans and billing

**What You'll See:**

- Active subscriptions list
- Subscription status (active, past_due, canceled)
- Renewal dates
- Plan types and pricing
- Bulk actions toolbar

**Key Actions:**

- **Cancel Subscription:** Click cancel button (with confirmation)
- **Reactivate Subscription:** For canceled subs (click reactivate)
- **Change Plan:** Upgrade/downgrade customer plans
- **Pause Subscription:** Temporarily pause billing
- **Apply Discount:** One-time or recurring discounts

**Subscription Detail View (`/admin/subscriptions/[id]`):**

- Full subscription timeline
- Billing history
- Payment method
- Usage vs. limits
- Upcoming charges

**Handling Cancellations:**

1. Click cancel button on subscription
2. Select cancellation reason
3. Choose: "Cancel immediately" or "Cancel at period end"
4. Optionally send cancellation survey
5. User receives confirmation email

**Handling Reactivations:**

1. Navigate to canceled subscription
2. Click "Reactivate" button
3. Confirm billing details
4. Select reactivation date
5. Process payment (if immediate)
6. User receives reactivation confirmation

**Tips:**

- Always document cancellation reasons
- Offer retention discount before confirming cancellation
- Monitor "past_due" status daily
- Set up automated dunning for failed payments

---

### 6. Promotions (`/admin/promotions`)

**Purpose:** Create and manage promotional campaigns

**What You'll See:**

- Active promotions list
- Promotion codes and redemption counts
- Discount types (%, fixed, free trial)
- Expiration dates
- Performance metrics

**Key Actions:**

- **Create Promotion:** Click "New Promotion" button
- **Edit Promotion:** Modify existing campaigns
- **Deactivate Promotion:** Stop accepting new redemptions
- **View Analytics:** See redemption rates and revenue impact

**Creating a Promotion:**

1. Click "New Promotion" button
2. Fill in details:
   - **Name:** Internal reference (e.g., "Spring Sale 2025")
   - **Code:** Customer-facing code (e.g., "SPRING25")
   - **Type:** Percentage, Fixed Amount, or Free Trial
   - **Value:** Discount amount or trial days
   - **Duration:** Once, Forever, or Repeating
   - **Limits:** Max redemptions, per-user limits
   - **Dates:** Start date, end date
   - **Target:** Specific plans or all plans
3. Click "Create Promotion"
4. Share code via email, social media, or ads

**Tips:**

- Use unique codes for tracking campaign performance
- Set redemption limits to control costs
- A/B test different discount amounts
- Create urgency with expiration dates
- Monitor redemption rates daily during campaigns

---

### 7. Analytics (`/admin/analytics`)

**Purpose:** Deep dive into platform metrics and trends

**What You'll See:**

- Customizable dashboards
- User engagement metrics
- Feature usage heatmaps
- Conversion funnels
- Cohort analysis
- Retention curves

**Key Metrics Tracked:**

- Daily/Monthly Active Users (DAU/MAU)
- User retention by cohort
- Feature adoption rates
- Email send/receive volume
- AI usage patterns
- SMS delivery rates
- Response time metrics
- Error rates by feature

**Advanced Analytics (`/admin/analytics/advanced`):**

- SQL query builder
- Custom report creation
- Data export (CSV, JSON)
- Scheduled reports
- API access for external BI tools

**Key Actions:**

- Create custom dashboards
- Set up automated reports
- Export data for external analysis
- Share dashboards with team members

**Tips:**

- Set up weekly automated reports
- Track North Star Metric (key growth indicator)
- Monitor product-market fit signals
- Use cohort analysis for retention insights
- Track feature usage before deprecating features

---

## 🔧 DEBUG TOOLS SECTION

### 8. Sync Jobs (`/admin/debug/sync-trace`)

**Purpose:** Monitor and debug email synchronization processes

**What You'll See:**

- Active sync jobs list
- Sync status (running, completed, failed)
- Provider (Gmail, Microsoft, IMAP)
- Progress indicators (emails synced / total)
- Error messages for failed syncs

**Key Actions:**

- **View Sync Details:** Click on any sync job
- **Retry Failed Sync:** Click retry button
- **Cancel Running Sync:** Stop stuck sync processes
- **Clear Sync History:** Clean up old completed syncs

**Sync Job Detail View (`/admin/debug/sync-trace/[jobId]`):**

- Detailed sync timeline
- Step-by-step progress log
- Performance metrics (emails/second)
- Error stack traces
- Provider-specific diagnostics

**Troubleshooting Sync Issues:**

**Problem: Sync Stuck at 0%**

- Check: Email account credentials valid?
- Check: Provider API rate limits?
- Action: Cancel and retry sync

**Problem: Sync Fails Midway**

- Check: Error logs for specific issue
- Check: Database connection healthy?
- Action: Retry from last checkpoint

**Problem: Sync Too Slow**

- Check: Large attachment downloads?
- Check: Provider throttling?
- Action: Adjust batch size in settings

**Tips:**

- Monitor sync jobs during onboarding
- Set up alerts for failed syncs
- Check sync performance weekly
- Keep sync logs for 30 days minimum

---

### 9. Connection Test (`/admin/debug/connection-test`)

**Purpose:** Test email provider connections and diagnose issues

**What You'll See:**

- Email provider test form
- Connection status indicators
- Authentication results
- API response times
- Error diagnostics

**Key Actions:**

- **Test Gmail Connection:** Verify Gmail API credentials
- **Test Microsoft Connection:** Verify Graph API access
- **Test IMAP Connection:** Verify IMAP server connectivity
- **Test Webhooks:** Verify webhook delivery
- **Test Database:** Verify database connectivity

**Testing Email Providers:**

1. Select provider (Gmail, Microsoft, IMAP)
2. Enter test credentials (or select existing account)
3. Click "Test Connection"
4. View results:
   - ✅ Connected successfully
   - ⚠️ Connected with warnings
   - ❌ Connection failed (with error details)

**Diagnostic Information:**

- API endpoint status
- Authentication token validity
- Rate limit status
- SSL/TLS certificate validity
- DNS resolution status
- Firewall/proxy detection

**Tips:**

- Test connections before onboarding new users
- Run tests weekly for production health checks
- Document connection issues for support team
- Keep test credentials secure (sandbox accounts)

---

### 10. Logs (`/admin/debug/logs`)

**Purpose:** Search and analyze application logs

**What You'll See:**

- Real-time log stream
- Log levels (error, warn, info, debug)
- Filterable log entries
- Searchable by user, action, or keyword
- Exportable log data

**Key Actions:**

- **Filter by Level:** Show only errors, warnings, etc.
- **Search Logs:** Find specific events or users
- **Export Logs:** Download for external analysis
- **Clear Logs:** Remove old log entries
- **Set Log Retention:** Configure how long logs are kept

**Log Levels Explained:**

- **ERROR** 🔴: Critical failures requiring immediate attention
- **WARN** 🟡: Potential issues that may need investigation
- **INFO** 🔵: Normal operation events (logins, actions)
- **DEBUG** ⚪: Detailed technical information for debugging

**Searching Logs:**

- By user: `user:user@example.com`
- By action: `action:login`
- By error: `error:timeout`
- By date: `date:2025-10-28`
- Combined: `user:user@example.com AND action:sync AND level:error`

**Common Log Searches:**

**Find Failed Logins:**

```
action:login AND level:error
```

**Find Sync Errors for User:**

```
user:user@example.com AND action:sync AND level:error
```

**Find Recent Critical Errors:**

```
level:error AND date:today
```

**Tips:**

- Check error logs every morning
- Set up alerts for critical errors
- Export logs for compliance audits
- Use log aggregation for production (Datadog, Sentry)

---

### 11. Profiler (`/admin/debug/profiler`)

**Purpose:** Monitor application performance and identify bottlenecks

**What You'll See:**

- API endpoint response times
- Slow query detection
- Database query performance
- Memory usage graphs
- CPU utilization charts

**Key Metrics:**

- **Response Time (p50, p95, p99):** API latency percentiles
- **Throughput:** Requests per second
- **Error Rate:** Failed requests percentage
- **Query Time:** Database query duration
- **Cache Hit Rate:** Percentage of cached responses

**Key Actions:**

- **View Slow Queries:** Click "Slow Queries" tab
- **View API Latency:** Check response times by endpoint
- **Analyze Memory Usage:** Track memory leaks
- **Export Performance Data:** Download for analysis

**Slow Queries View (`/admin/debug/profiler/slow-queries`):**

- List of queries taking >1 second
- Query execution time
- Number of executions
- Query text (sanitized)
- Optimization suggestions

**API Latency View (`/admin/debug/profiler/api-latency`):**

- Response time charts by endpoint
- Slowest endpoints ranked
- Trend analysis over time
- Performance comparison

**Performance Optimization Workflow:**

1. Identify slow endpoints (>500ms)
2. Check for N+1 query problems
3. Add database indexes if needed
4. Implement caching where appropriate
5. Monitor improvements

**Tips:**

- Run profiler weekly to catch regressions
- Set performance budgets (e.g., <200ms API responses)
- Optimize top 10 slowest queries first
- Use profiler before major releases

---

## 🧪 BETA PROGRAM SECTION

### 12. Beta Dashboard (`/admin/beta`)

**Purpose:** Overview of beta testing program

**What You'll See:**

- Total beta users count
- Active beta users (last 7 days)
- Feedback submissions count
- AI-generated action items count
- Credit usage statistics
- Upcoming expirations

**Quick Stats Cards:**

- **Total Beta Users:** Number of invited testers
- **Active Rate:** % of users active in last 7 days
- **Feedback Count:** Total feedback submissions
- **Action Items:** AI-generated development tasks
- **Avg. Rating:** Average feedback rating (1-5 stars)
- **Days Until Expiration:** Earliest beta expiration

**Recent Activity Feed:**

- New feedback submissions
- Beta user invitations sent
- Credits exhausted alerts
- Graduation to paid users
- Expiration reminders sent

**Navigation Links:**

- Manage Beta Users →
- View Feedback →
- Review AI Insights →
- Check Analytics →

**Tips:**

- Check dashboard daily during active beta
- Monitor feedback submission rate
- Track credit usage trends
- Follow up on low-rated feedback immediately

---

### 13. Beta Users (`/admin/beta/users`)

**Purpose:** Manage beta user invitations and accounts

**What You'll See:**

- List of all beta users
- Invitation status (invited, active, expired)
- Credit usage (SMS: X/50, AI: Y/100)
- Days remaining until expiration
- Last login date
- Quick actions menu

**Key Actions:**

- **Invite New Beta User:** Click "Invite Beta User" button
- **View User Details:** Click on user row
- **Resend Invitation:** For users who didn't activate
- **Extend Beta Period:** Add more days
- **Add Credits:** Increase SMS/AI limits
- **Graduate to Paid:** Convert beta user to paying customer
- **Remove Beta User:** End beta access

**Inviting a Beta User:**

1. Click "Invite Beta User" button
2. Fill in form:
   - **Email:** User's email address
   - **Full Name:** First and last name
   - **Beta Duration:** Days (default: 90)
   - **SMS Credits:** Monthly limit (default: 50)
   - **AI Credits:** Monthly limit (default: 100)
   - **Custom Message:** Optional personal note
3. Click "Send Invitation"
4. User receives welcome email with:
   - Temporary username/password
   - Beta program details
   - Credits information
   - Expiration date

**User Detail View (`/admin/beta/users/[id]`):**

- Full profile information
- Credit usage history (charts)
- Feedback submissions
- Activity timeline
- Email notifications sent
- Login history

**Managing Credits:**

- Credits reset monthly on anniversary date
- SMS credits: $0.01 per message
- AI credits: $0.001 per AI operation
- Alerts sent at 80% and 100% usage

**Graduating Beta Users:**

1. Select user from list
2. Click "Graduate to Paid" button
3. Choose subscription tier
4. Send graduation email with discount code
5. User automatically upgraded

**Tips:**

- Invite users in waves (10-20 at a time)
- Track activation rate (target: >70%)
- Send reminder emails to inactive users
- Reward active users with extended access

---

### 14. Feedback (`/admin/beta/feedback`)

**Purpose:** View and manage beta user feedback

**What You'll See:**

- Feedback list with ratings
- Feedback type (feature request, bug report, general)
- Sentiment (positive, neutral, negative)
- Priority (low, medium, high) - AI-generated
- Status (new, reviewing, implemented, won't fix)
- Tags (AI-generated)

**Key Actions:**

- **View Feedback Details:** Click on feedback item
- **Update Status:** Mark as reviewing/implemented/won't fix
- **Assign to Team Member:** Route to developer
- **Reply to User:** Send thank you message
- **Create Action Item:** Convert to development task
- **Filter Feedback:** By type, status, priority, sentiment

**Feedback Detail View:**

- Full feedback description
- Screenshots (if attached)
- User information
- AI analysis:
  - Sentiment score
  - Auto-generated tags
  - Priority suggestion
  - Similar feedback items
- Action items created from this feedback
- Admin notes (internal)
- Reply history

**Responding to Feedback:**

1. Read feedback thoroughly
2. Check AI analysis for context
3. Click "Reply to User" button
4. Write personalized response
5. Update status appropriately
6. Send thank you email

**Feedback Status Workflow:**

- **New:** Just submitted, needs review
- **Reviewing:** Team is evaluating
- **Implemented:** Feature built or bug fixed
- **Won't Fix:** Out of scope or not feasible

**Tips:**

- Respond to all feedback within 24 hours
- Thank users for reporting bugs
- Be transparent about what won't be built
- Ask clarifying questions when needed
- Close the loop - tell users when implemented

---

### 15. AI Insights (`/admin/beta/insights`)

**Purpose:** AI-generated analysis and action items from feedback

**What You'll See:**

- AI-generated summary of all feedback
- Sentiment analysis breakdown
- Top requested features (ranked)
- Most common issues (ranked)
- Action items list (prioritized)
- Trend charts

**AI Summary Sections:**

**Overall Sentiment:**

- Positive: XX%
- Neutral: XX%
- Negative: XX%
- Sentiment trend over time

**Top Feature Requests:**

1. Feature name (XX mentions)
2. Feature name (XX mentions)
3. Feature name (XX mentions)

**Top Issues/Bugs:**

1. Issue description (XX reports)
2. Issue description (XX reports)
3. Issue description (XX reports)

**Key Themes:**

- Theme 1: Description
- Theme 2: Description
- Theme 3: Description

**Action Items List:**

- **High Priority** (Impact 8-10/10)
  - Task 1: Description
  - Task 2: Description
- **Medium Priority** (Impact 4-7/10)
  - Task 3: Description
- **Low Priority** (Impact 1-3/10)
  - Task 4: Description

**Action Item Details:**

- Title and description
- Priority (High/Medium/Low)
- Impact score (1-10)
- Effort estimate (Small/Medium/Large)
- Related feedback items (linked)
- Suggested solution (AI-generated)
- Assigned to (team member)
- Status (Todo/In Progress/Done/Cancelled)

**Key Actions:**

- **Generate New Report:** Run AI analysis on latest feedback
- **View Action Item:** Click to see full details
- **Update Status:** Mark action items as complete
- **Assign to Developer:** Route to team member
- **Export Report:** Download as PDF/CSV

**Generating AI Insights:**

1. Click "Generate New Report" button
2. Wait 30-60 seconds for AI processing
3. Review AI-generated summary
4. Check action items for accuracy
5. Adjust priorities if needed
6. Assign tasks to team
7. Share with stakeholders

**Tips:**

- Generate new report weekly
- Review action items in team meetings
- Track completion rate (target: >50%)
- Use insights for sprint planning
- Share sentiment trends with leadership

---

### 16. Beta Analytics (`/admin/beta/analytics`)

**Purpose:** Track beta user engagement and usage metrics

**What You'll See:**

- Daily active users (DAU) chart
- Feature usage breakdown
- Credit usage trends
- Conversion rate (beta → paid)
- Retention curves
- Top engaged users

**Key Metrics:**

**Engagement Metrics:**

- **DAU (Daily Active Users):** Users active in last 24h
- **WAU (Weekly Active Users):** Users active in last 7 days
- **MAU (Monthly Active Users):** Users active in last 30 days
- **Session Duration:** Average time spent per session
- **Feature Adoption:** % of users trying each feature

**Usage Metrics:**

- **SMS Usage:** Total messages sent
- **AI Usage:** Total AI operations
- **Emails Synced:** Total emails synchronized
- **Feedback Submitted:** Total feedback items

**Conversion Metrics:**

- **Activation Rate:** % of invited users who logged in
- **Engagement Rate:** % of active users (DAU/Total)
- **Retention Rate:** % of users returning after 7/30 days
- **Conversion Rate:** % of beta users who became paid
- **Time to Convert:** Average days from beta → paid

**Feature Usage Breakdown:**

- Email Sync: XX% of users
- AI Reply: XX% of users
- SMS Messaging: XX% of users
- Voice Messages: XX% of users
- Thread Summarization: XX% of users

**Top Engaged Users:**

1. User name (XX logins, XX actions)
2. User name (XX logins, XX actions)
3. User name (XX logins, XX actions)

**Key Actions:**

- **Export Analytics Data:** Download CSV
- **Filter by Date Range:** Custom period
- **View User Details:** Click on user name
- **Share Report:** Generate shareable link

**Tips:**

- Monitor DAU/MAU ratio (target: >40%)
- Track feature adoption weekly
- Identify power users for testimonials
- Follow up with inactive users
- Use insights for product roadmap

---

## ⚙️ SYSTEM SECTION

### 17. Permissions (`/admin/permissions`)

**Purpose:** Manage role-based access control

**What You'll See:**

- List of all permissions (20 default)
- Roles and their permissions
- Permission overrides per user
- Permission usage statistics

**Default Permissions:**

- `user.view` - View user profiles
- `user.edit` - Edit user information
- `user.delete` - Delete users
- `billing.view` - View billing information
- `billing.edit` - Manage billing
- `support.view` - View support tickets
- `support.edit` - Manage tickets
- `admin.access` - Access admin panel
- (and 12 more...)

**Role-Permission Matrix:**

| Role        | Permissions Count | Key Permissions           |
| ----------- | ----------------- | ------------------------- |
| User        | 5                 | Basic account management  |
| Support     | 12                | Support + limited billing |
| Admin       | 18                | Most admin features       |
| Super Admin | 20                | Full system access        |

**Key Actions:**

- **View Role Permissions:** Click on role to see all permissions
- **Grant Permission Override:** Give specific user extra permissions
- **Revoke Permission Override:** Remove user-specific permissions
- **Create Custom Role:** Define new role with specific permissions
- **Audit Permissions:** See who has access to what

**Granting Permission Override:**

1. Navigate to user detail page
2. Scroll to "Permission Overrides" section
3. Click "Grant Permission"
4. Select permission from dropdown
5. Add reason (for audit trail)
6. Click "Grant"
7. User immediately gains access

**Tips:**

- Follow principle of least privilege
- Document why overrides were granted
- Review permission overrides quarterly
- Revoke overrides when no longer needed
- Use roles instead of many overrides

---

### 18. Email Templates (`/admin/email-templates`)

**Purpose:** Manage system email templates

**What You'll See:**

- List of all email templates
- Template categories (transactional, marketing, support)
- Preview of template design
- Send test button
- Usage statistics

**Default Templates:**

- Welcome Email
- Password Reset
- Email Verification
- Subscription Confirmation
- Payment Failed (Dunning)
- Payment Successful
- Beta Invitation
- Feedback Thank You
- And more...

**Template Editor:**

- Subject line editor
- HTML email editor (WYSIWYG)
- Plain text fallback
- Dynamic variables ({{userName}}, {{expirationDate}}, etc.)
- Preview mode (desktop, mobile)
- Test send functionality

**Available Variables:**

- `{{userName}}` - User's display name
- `{{userEmail}}` - User's email address
- `{{companyName}}` - Your company name
- `{{supportEmail}}` - Support email address
- `{{unsubscribeLink}}` - Unsubscribe URL
- Template-specific variables (see each template)

**Key Actions:**

- **Edit Template:** Click edit button
- **Preview Template:** View rendered email
- **Send Test:** Send to your email
- **Duplicate Template:** Create variant for A/B testing
- **Restore Default:** Revert to original template
- **View Analytics:** Opens, clicks, conversions

**Editing a Template:**

1. Click "Edit" button on template
2. Modify subject line
3. Edit email body (HTML or visual editor)
4. Update plain text version
5. Click "Preview" to see changes
6. Send test email to yourself
7. Click "Save Template"
8. Changes take effect immediately

**Tips:**

- Always send test emails before saving
- Keep plain text version for email clients that don't support HTML
- Use personalization variables for better engagement
- A/B test subject lines for important emails
- Monitor open rates and adjust accordingly

---

### 19. Email Accounts (`/admin/email-accounts`)

**Purpose:** Monitor all connected email accounts

**What You'll See:**

- List of all connected email accounts
- Provider (Gmail, Microsoft, IMAP)
- Connection status (connected, disconnected, error)
- Last sync time
- Email count
- User owner

**Key Actions:**

- **View Account Details:** Click on account
- **Test Connection:** Verify credentials still valid
- **Force Resync:** Trigger full re-synchronization
- **Disconnect Account:** Remove account (with confirmation)
- **View Sync History:** See past sync jobs

**Account Status Indicators:**

- 🟢 **Connected:** Working normally
- 🟡 **Warning:** Connection issue, needs attention
- 🔴 **Disconnected:** Not syncing, user needs to reconnect
- ⚪ **Syncing:** Currently synchronizing

**Account Detail View:**

- Provider information
- OAuth token expiration
- Last successful sync
- Total emails synced
- Folders synchronized
- Sync errors (if any)
- User information

**Troubleshooting Disconnected Accounts:**

**Gmail Disconnected:**

1. Check if user revoked OAuth access
2. Test connection in Debug > Connection Test
3. Send user reconnection email
4. User clicks "Reconnect Gmail" in settings

**Microsoft Disconnected:**

1. Check token expiration
2. Verify Graph API permissions
3. Test connection
4. User reconnects account

**Tips:**

- Monitor disconnected accounts weekly
- Send automated reconnection reminders
- Track why accounts disconnect (patterns)
- Keep sync history for troubleshooting

---

### 20. Notification Templates (`/admin/notification-templates`)

**Purpose:** Manage in-app notification templates

**What You'll See:**

- List of notification templates
- Template type (success, error, warning, info)
- Trigger events
- Active/inactive status
- Usage statistics

**Notification Types:**

- **Email Sync Complete:** "Your inbox is up to date"
- **Payment Received:** "Thank you for your payment"
- **Credit Low:** "You have 5 SMS credits remaining"
- **Beta Expiration:** "Your beta access expires in 7 days"
- **Feature Announcement:** "New feature: Voice Messages"

**Template Detail View (`/admin/notification-templates/[id]`):**

- Title and message
- Icon selection
- Duration (how long shown)
- Action buttons (optional)
- Target audience (all users, specific roles, etc.)
- Schedule (immediate, delayed, recurring)

**Creating New Template (`/admin/notification-templates/new`):**

1. Click "New Template" button
2. Fill in details:
   - **Title:** Short headline
   - **Message:** Full notification text
   - **Type:** Success/Error/Warning/Info
   - **Icon:** Select from library
   - **Duration:** 5s, 10s, or persistent
   - **Action Button:** Optional CTA
   - **Target:** Who sees this
   - **Trigger:** When to show
3. Click "Create Template"
4. Test notification appears immediately

**Tips:**

- Use notifications sparingly (avoid fatigue)
- Make notifications actionable
- Test notifications across devices
- Monitor dismissal rate (high = annoying)
- Use persistent for critical alerts only

---

### 21. Features (`/admin/features`)

**Purpose:** Manage feature flags and A/B tests

**What You'll See:**

- List of all feature flags
- Enabled/disabled status
- Rollout percentage
- Target audience
- A/B test results

**Feature Flag Use Cases:**

- Gradual rollout of new features
- A/B testing different UX approaches
- Emergency feature shutdown
- Beta feature access
- Plan-specific features

**Key Actions:**

- **Enable Feature:** Turn on feature flag
- **Disable Feature:** Turn off feature (emergency)
- **Set Rollout Percentage:** Gradual rollout (10%, 50%, 100%)
- **Target Specific Users:** Enable for certain users only
- **View Analytics:** Feature usage and impact

**Creating a Feature Flag:**

1. Click "New Feature" button
2. Fill in details:
   - **Name:** Internal reference (e.g., `voice_messages`)
   - **Label:** Display name (e.g., "Voice Messages")
   - **Description:** What this feature does
   - **Status:** Enabled/Disabled
   - **Rollout:** Percentage of users (0-100%)
   - **Target:** All users, specific tiers, or custom
3. Click "Create Feature"
4. Feature flag ready to use in code

**A/B Testing:**

1. Create two feature flags (variant_a, variant_b)
2. Set each to 50% rollout
3. Monitor usage and conversion metrics
4. After sufficient data, choose winner
5. Roll out winner to 100%
6. Disable losing variant

**Tips:**

- Start with 10% rollout for new features
- Monitor error rates during rollout
- Have kill switch ready for emergencies
- Document what each feature flag controls
- Clean up old feature flags quarterly

---

### 22. Pricing (`/admin/pricing`)

**Purpose:** Manage subscription plans and pricing

**What You'll See:**

- List of all plans (Individual, Team, Enterprise)
- Plan features comparison
- Pricing by billing cycle (monthly/annual)
- Active subscriptions per plan
- Plan change history

**Current Plans:**

**Individual Plan:**

- Price: $X/month or $Y/year
- Features: List of included features
- Limits: Email accounts, SMS, AI credits
- Users: X active subscribers

**Team Plan:**

- Price: $X/month or $Y/year
- Features: Everything in Individual + team features
- Limits: Higher limits
- Users: X active subscribers

**Enterprise Plan:**

- Price: Custom
- Features: Everything + enterprise features
- Limits: Custom
- Users: X active subscribers

**Key Actions:**

- **Edit Plan Pricing:** Change price (affects new subscriptions only)
- **Add/Remove Features:** Update plan inclusions
- **Create New Plan:** Add new pricing tier
- **Archive Plan:** Stop offering plan (existing users grandfathered)
- **Bulk Upgrade Users:** Migrate users between plans

**Changing Plan Pricing:**

1. Click "Edit" on plan
2. Update pricing fields
3. Choose effective date:
   - **Immediately:** New subscriptions only
   - **Next Billing Cycle:** Existing users affected
   - **Custom Date:** Schedule price change
4. Click "Save Changes"
5. Existing subscribers receive notification email

**Tips:**

- Grandfather existing users when raising prices
- Test pricing changes with small user group first
- Monitor churn rate after price changes
- Offer annual discount (typically 20%)
- Review pricing quarterly based on costs

---

### 23. Privacy (`/admin/privacy`)

**Purpose:** Manage user data privacy and GDPR compliance

**What You'll See:**

- Data export requests
- Data deletion requests
- Privacy policy version
- Cookie consent tracking
- GDPR compliance checklist

**Data Export Requests:**

- User name and email
- Request date
- Status (pending, processing, completed)
- Export file (downloadable)

**Data Deletion Requests:**

- User name and email
- Request date
- Status (pending, under review, scheduled, completed)
- Retention period (30 days legal hold)
- Final deletion date

**Key Actions:**

- **Process Export Request:** Generate user data package
- **Review Deletion Request:** Approve/deny deletion
- **Schedule Deletion:** Set deletion date (30 days minimum)
- **View Export:** Download generated data package
- **Audit Requests:** See all privacy requests history

**Processing Export Request:**

1. User submits request via settings
2. Request appears in admin panel
3. Click "Process Request"
4. System generates ZIP file with:
   - Profile data (JSON)
   - Emails (MBOX format)
   - Attachments
   - Activity logs
   - Billing history
5. User receives download link via email
6. Link expires in 7 days

**Processing Deletion Request:**

1. User submits deletion request
2. Request appears in admin panel (status: pending)
3. Admin reviews request (verify user identity)
4. Click "Approve Deletion"
5. 30-day grace period starts (user can cancel)
6. After 30 days, data is permanently deleted
7. User receives confirmation email

**GDPR Compliance Checklist:**

- ✅ Privacy policy accessible
- ✅ Cookie consent banner implemented
- ✅ Data export available (within 30 days)
- ✅ Data deletion available (within 30 days)
- ✅ Data processing agreements in place
- ✅ Breach notification procedure documented
- ✅ Data protection officer assigned
- ✅ Privacy by design implemented

**Tips:**

- Process export requests within 30 days (GDPR requirement)
- Keep export files secure (contain PII)
- Document all deletion requests
- Verify user identity before deletion
- Retain billing data for legal requirements (7 years)

---

### 24. Support (`/admin/support`)

**Purpose:** Manage customer support tickets

**What You'll See:**

- Support ticket queue
- Ticket status (new, open, pending, solved)
- Priority (low, normal, high, urgent)
- Assigned agent
- Response time metrics
- Customer satisfaction scores

**Ticket Detail View (`/admin/support/[id]`):**

- Full conversation history
- Customer information
- Related tickets
- Internal notes
- Time tracking
- Attachments

**Key Actions:**

- **Reply to Ticket:** Send response to customer
- **Assign Ticket:** Route to team member
- **Set Priority:** Change urgency level
- **Add Internal Note:** Team-only communication
- **Mark as Solved:** Close ticket
- **Reopen Ticket:** If customer responds
- **Merge Tickets:** Combine duplicate tickets

**Creating Support Ticket (`/admin/support/new`):**

1. Click "New Ticket" button
2. Fill in form:
   - **Customer:** Select existing user or enter email
   - **Subject:** Brief description
   - **Description:** Full issue details
   - **Priority:** Set urgency
   - **Assign To:** Team member (or auto-assign)
3. Click "Create Ticket"
4. Customer receives ticket confirmation email

**Support Metrics Dashboard:**

- **First Response Time:** Target <2 hours
- **Resolution Time:** Target <24 hours
- **Customer Satisfaction:** Target >90%
- **Open Tickets:** Current backlog
- **Tickets Today:** New tickets received

**Ticket Status Workflow:**

- **New:** Just created, needs triage
- **Open:** Being worked on by agent
- **Pending:** Waiting for customer response
- **Solved:** Issue resolved, ticket closed
- **Closed:** Archived (after 7 days of no response)

**Tips:**

- Respond to all tickets within 2 hours
- Use canned responses for common issues
- Set up auto-responses for after hours
- Monitor customer satisfaction scores
- Create knowledge base from common questions

---

### 25. Knowledge Base (`/admin/knowledge-base`)

**Purpose:** Manage help documentation and FAQs

**What You'll See:**

- List of all articles
- Article categories
- View count statistics
- Search effectiveness
- Article rating (helpful/not helpful)

**Article Categories:**

- Getting Started
- Email Sync
- AI Features
- Billing & Subscriptions
- Privacy & Security
- Troubleshooting
- API Documentation

**Article Detail View (`/admin/knowledge-base/edit/[id]`):**

- Title and URL slug
- Content editor (Markdown or rich text)
- Category selection
- Tags for search
- Related articles
- SEO meta description
- Published/draft status

**Creating New Article (`/admin/knowledge-base/new`):**

1. Click "New Article" button
2. Fill in details:
   - **Title:** Clear, searchable title
   - **Category:** Select appropriate category
   - **Content:** Write article (Markdown supported)
   - **Tags:** Keywords for search
   - **Related Articles:** Link to related content
   - **Featured Image:** Optional header image
3. Click "Preview" to see rendered article
4. Click "Publish" or "Save as Draft"

**Managing Categories (`/admin/knowledge-base/categories`):**

- Create new categories
- Reorder categories (drag & drop)
- Edit category name/description
- Set category icon
- Archive old categories

**Knowledge Base Analytics:**

- **Most Viewed Articles:** Top 10 popular articles
- **Least Viewed Articles:** Content that needs promotion
- **Search Terms:** What users are searching for
- **Helpfulness Score:** % of users marking "helpful"
- **Time on Page:** Article engagement

**Tips:**

- Write articles for common support questions
- Update articles when features change
- Monitor search terms to identify gaps
- Ask support team for article ideas
- Include screenshots and GIFs
- Link between related articles
- Review and update quarterly

---

### 26. Monitoring (`/admin/monitoring`)

**Purpose:** Monitor system health and set up alerts

**What You'll See:**

- System health status
- Uptime percentage (target: 99.9%)
- API response times
- Error rates
- Active alerts
- Alert history

**Monitoring Dashboards:**

**System Health:**

- ✅ API Status: Operational
- ✅ Database: Healthy
- ✅ Email Sync: Running
- ✅ Payment Processing: Operational
- ⚠️ Webhook Delivery: Degraded (view details)

**Performance Metrics:**

- API Response Time (p95): 250ms
- Database Query Time: 45ms
- Email Sync Speed: 100 emails/min
- Error Rate: 0.05%
- Uptime: 99.95%

**Alert Rules (`/admin/monitoring/alerts`):**

- List of configured alerts
- Alert conditions
- Notification channels (email, Slack, SMS)
- Alert history
- Mute/unmute alerts

**Creating Alert Rule (`/admin/monitoring/alerts/new`):**

1. Click "New Alert" button
2. Fill in details:
   - **Name:** Alert description
   - **Condition:** What triggers alert
     - Example: "Error rate > 1%"
     - Example: "API response time > 500ms"
     - Example: "Failed syncs > 5 in 10 minutes"
   - **Threshold:** When to trigger
   - **Duration:** How long condition must persist
   - **Channels:** Email, Slack, SMS, PagerDuty
   - **Recipients:** Who to notify
   - **Severity:** Low/Medium/High/Critical
3. Click "Test Alert" to verify
4. Click "Create Alert"

**Testing Alert Rule:**

1. Navigate to alert rule
2. Click "Test" button
3. System simulates alert condition
4. Verify notification received
5. Adjust as needed

**Tips:**

- Set up alerts for critical systems
- Avoid alert fatigue (too many alerts)
- Test alerts regularly
- Have escalation path for critical alerts
- Document on-call procedures
- Use PagerDuty for after-hours alerts

---

### 27. Audit Logs (`/admin/audit-logs`)

**Purpose:** Track all admin actions for security and compliance

**What You'll See:**

- Chronological log of all admin actions
- Who did what, when
- IP addresses
- Action details
- Success/failure status
- Exportable for compliance

**Logged Actions:**

- User created/edited/deleted
- Role changed
- Permission granted/revoked
- Subscription modified
- Refund issued
- Deletion request processed
- Support ticket viewed
- Export data generated
- Price changed
- Feature flag toggled
- System settings modified

**Audit Log Entry Details:**

- **Timestamp:** When action occurred
- **Admin User:** Who performed action
- **Action Type:** What was done
- **Target:** Who/what was affected
- **Details:** Additional context (JSON)
- **IP Address:** Where request came from
- **User Agent:** Browser/device info
- **Status:** Success or failure

**Searching Audit Logs:**

- By admin user
- By action type
- By date range
- By target user
- By IP address

**Key Actions:**

- **Search Logs:** Find specific events
- **Filter Logs:** By user, action, date
- **Export Logs:** Download CSV for compliance
- **View Details:** Expand log entry for full context

**Compliance Reports:**

- **GDPR Data Access Report:** Who accessed user data
- **Administrative Actions Report:** All admin changes
- **Security Events Report:** Failed logins, permission changes
- **Billing Actions Report:** All financial transactions

**Tips:**

- Review audit logs weekly for suspicious activity
- Export logs monthly for compliance archival
- Set up alerts for sensitive actions (deletions, permission changes)
- Keep audit logs for minimum 7 years (compliance)
- Never delete audit logs

---

## 🎓 BEST PRACTICES

### Daily Admin Tasks

**Morning (9 AM):**

- [ ] Check admin dashboard for system health
- [ ] Review error logs from overnight
- [ ] Check for failed syncs
- [ ] Monitor payment failures

**Throughout Day:**

- [ ] Respond to support tickets within 2 hours
- [ ] Process user deletion requests
- [ ] Monitor beta user activity
- [ ] Check feedback submissions

**Evening (5 PM):**

- [ ] Review daily sales metrics
- [ ] Check for any critical alerts
- [ ] Process pending user invitations

### Weekly Admin Tasks

**Every Monday:**

- [ ] Review MRR and churn metrics
- [ ] Check upcoming subscription renewals
- [ ] Plan promotional campaigns
- [ ] Review beta program progress

**Every Wednesday:**

- [ ] Generate AI insights from feedback
- [ ] Review slow query reports
- [ ] Check feature flag usage
- [ ] Audit permission changes

**Every Friday:**

- [ ] Export weekly analytics report
- [ ] Review support ticket metrics
- [ ] Plan next week's priorities
- [ ] Update knowledge base articles

### Monthly Admin Tasks

**First Week of Month:**

- [ ] Generate monthly revenue report
- [ ] Review churn analysis
- [ ] Process export requests (GDPR)
- [ ] Audit user permissions

**Mid-Month:**

- [ ] Review pricing strategy
- [ ] Analyze feature adoption rates
- [ ] Plan product roadmap adjustments
- [ ] Check backup system health

**End of Month:**

- [ ] Export audit logs for archival
- [ ] Review payment failure patterns
- [ ] Plan next month's beta invitations
- [ ] Update system documentation

---

## 🆘 TROUBLESHOOTING

### Common Issues and Solutions

#### Issue: Cannot Log into Admin Panel

**Symptoms:** 403 Forbidden or redirect to login

**Solutions:**

1. Verify your user account has admin role
2. Check permission overrides weren't revoked
3. Clear browser cache and cookies
4. Try incognito/private browsing mode
5. Contact super admin to restore permissions

#### Issue: Sync Jobs Stuck

**Symptoms:** Sync shows "running" for hours

**Solutions:**

1. Go to Debug > Sync Jobs
2. Find stuck sync job
3. Click "Cancel" to stop it
4. Click "Retry" to restart sync
5. Check Debug > Logs for error details
6. If persists, contact support

#### Issue: Payment Webhook Not Working

**Symptoms:** Stripe events not processing

**Solutions:**

1. Go to Debug > Connection Test
2. Test webhook endpoint
3. Check Stripe webhook signature is correct
4. Verify webhook URL in Stripe dashboard
5. Check Debug > Logs for webhook errors
6. Resend failed webhooks from Stripe

#### Issue: Email Templates Not Sending

**Symptoms:** Users not receiving emails

**Solutions:**

1. Go to Email Templates
2. Click "Send Test" on affected template
3. Check if test email received
4. Verify Resend API key is set
5. Check email service status
6. Review sent email logs

#### Issue: High Error Rate Alert

**Symptoms:** Alert email received

**Solutions:**

1. Go to Debug > Logs
2. Filter by level: ERROR
3. Identify common error pattern
4. Check if external service is down (Stripe, Google, etc.)
5. Review recent deployments
6. Rollback if needed

---

## 📖 GLOSSARY

**Beta User:** Tester with temporary free access and credits

**Churn Rate:** Percentage of customers who cancel

**DAU:** Daily Active Users

**Dunning:** Process of recovering failed payments

**Feature Flag:** Toggle to enable/disable features

**GDPR:** EU data protection regulation

**LTV:** Lifetime Value - total revenue from customer

**MRR:** Monthly Recurring Revenue

**PITR:** Point-in-Time Recovery for databases

**RLS:** Row Level Security in database

**SLA:** Service Level Agreement

**WAU:** Weekly Active Users

---

## 🔗 QUICK LINKS

**Admin Panel:** https://easemail.app/admin

**Supabase Dashboard:** https://supabase.com/dashboard/project/hfduyqvdajtvnsldqmro

**Stripe Dashboard:** https://dashboard.stripe.com

**Resend Dashboard:** https://resend.com/dashboard

**GitHub Repository:** [Your GitHub URL]

**Monitoring:** https://easemail.app/admin/monitoring

**Support Documentation:** https://easemail.app/admin/knowledge-base

---

## 📞 SUPPORT

**For Technical Issues:**

- Email: dev@easemail.app
- Slack: #engineering channel

**For Product Questions:**

- Email: product@easemail.app
- Slack: #product channel

**Emergency Contact:**

- On-Call Phone: [Number]
- Escalation: Super Admin

---

## 📅 CHANGELOG

**Version 1.0 (October 28, 2025):**

- Initial release
- All 39 admin pages documented
- Best practices included
- Troubleshooting guide added

---

**End of Admin User Guide**

_This guide is maintained by the EaseMail team. Last updated: October 28, 2025_
