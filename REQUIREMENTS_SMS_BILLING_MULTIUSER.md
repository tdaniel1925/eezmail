# SMS Billing & Multi-User Account Requirements

## Current Implementation Status
✅ SMS delivery tracking implemented
✅ Timeline events with delivery status
✅ Cost tracking in communication logs (via `logCommunicationUsage`)

---

## FUTURE FEATURES TO BUILD

### 1. SMS Billing & Cost Tracking

#### Current Structure:
- `communication_logs` table tracks SMS usage
- Cost stored per message: `$0.0075` (US rate)
- User-level tracking via `userId`

#### Requirements Questions:

**A. Billing Model:**
- [ ] **Pay-per-SMS** (charge per message sent)?
- [ ] **Monthly plans** with SMS quotas (e.g., 100 SMS/month on Basic, 1000 on Pro)?
- [ ] **Overage charges** when quota exceeded?
- [ ] **Prepaid credits** system?

**B. Cost Structure:**
- [ ] Fixed rate per SMS regardless of destination?
- [ ] Variable rates by country/region?
- [ ] Different rates for: SMS vs MMS? Shortcode vs Long Code?

**C. Billing Integration:**
- [ ] Integrate with existing Stripe/Square payment processors?
- [ ] Monthly invoicing?
- [ ] Real-time balance deduction?
- [ ] Usage alerts/warnings at 80%, 100% of quota?

**D. Reporting & Analytics:**
- [ ] Usage dashboard showing: SMS sent, cost, success rate?
- [ ] Export usage reports (CSV/PDF)?
- [ ] Real-time cost tracker?
- [ ] Historical billing data retention period?

---

### 2. Master Accounts / Company Multi-User System

#### Current Structure:
- Each user has individual `userId`
- Individual Twilio credentials per user
- Individual contact lists

#### Architecture Questions:

**A. Account Hierarchy:**
```
Option 1: Company → Users
- Company (master account)
  ├── Admin Users (full access)
  ├── Manager Users (limited access)
  └── Standard Users (basic access)

Option 2: Workspace Model
- Workspace (shared resources)
  ├── Owner (billing, admin)
  ├── Members (shared contacts, shared SMS pool)
  └── Guests (view-only)

Option 3: Team-Based
- Organization
  ├── Teams
  │   ├── Sales Team
  │   └── Support Team
  └── Users assigned to teams
```

**Which model fits your business?**

**B. Resource Sharing:**
- [ ] **Shared contact database** across company?
- [ ] **Shared SMS pool/quota** for all users?
- [ ] **Shared Twilio credentials** or individual?
- [ ] **Shared timeline/communication history**?
- [ ] **Shared tags, groups, custom fields**?

**C. Billing & Cost Allocation:**
- [ ] **Master billing** (company pays for all users)?
- [ ] **Cost allocation** per user/team for reporting?
- [ ] **Department budgets** (e.g., Sales: $500/mo, Support: $300/mo)?
- [ ] **Individual user limits** within company quota?

**D. Permissions & Access Control:**
```
Admin Level:
- [ ] Manage users (add/remove/deactivate)
- [ ] View all communications
- [ ] Manage billing
- [ ] Configure company settings
- [ ] Access all contacts

Manager Level:
- [ ] Manage team members
- [ ] View team communications
- [ ] Access team contacts
- [ ] View team billing/usage

User Level:
- [ ] Send SMS
- [ ] Manage own contacts
- [ ] View own communications
- [ ] Limited billing visibility
```

**E. User Management:**
- [ ] Invite system (email invites)?
- [ ] SSO / SAML integration?
- [ ] User provisioning (bulk import)?
- [ ] User deactivation vs deletion?
- [ ] Transfer ownership of contacts when user leaves?

**F. Usage & Monitoring:**
- [ ] Company-wide usage dashboard?
- [ ] Per-user usage tracking?
- [ ] Per-team usage tracking?
- [ ] Cost center allocation?
- [ ] Real-time usage alerts?

---

## Database Schema Changes Needed

### New Tables Required:

```sql
-- Organizations/Companies
organizations
  - id
  - name
  - plan_tier (free, basic, pro, enterprise)
  - sms_quota_monthly
  - sms_used_current_month
  - billing_email
  - stripe_customer_id
  - square_customer_id
  - created_at
  - updated_at

-- Organization Members
organization_members
  - id
  - organization_id
  - user_id
  - role (owner, admin, manager, member)
  - permissions (jsonb)
  - sms_quota_individual (optional per-user limit)
  - created_at
  - invited_by

-- Teams (optional)
teams
  - id
  - organization_id
  - name
  - sms_budget_monthly
  - created_at

-- Team Members (optional)
team_members
  - id
  - team_id
  - user_id
  - role

-- Enhanced Communication Logs
communication_logs (existing, enhance with):
  - organization_id
  - team_id (optional)
  - cost_allocated_to (user/team/org)
  - billing_status (pending, billed, failed)
  - invoice_id

-- Invoices
invoices
  - id
  - organization_id
  - period_start
  - period_end
  - total_sms_count
  - total_cost
  - stripe_invoice_id / square_invoice_id
  - status (draft, sent, paid, failed)
  - created_at
```

---

## Priority Questions to Answer:

### 🔴 CRITICAL (need answers to proceed):

1. **What's your primary use case?**
   - B2B SaaS where companies buy for their teams?
   - Individual users who can optionally create a team?
   - Enterprise sales with custom contracts?

2. **Billing model?**
   - Subscription tiers with SMS included?
   - Pure pay-per-use?
   - Hybrid (base subscription + overage)?

3. **Who pays the bill?**
   - Always the company/organization?
   - Can be individual users?
   - Mix of both?

### 🟡 IMPORTANT (needed for design):

4. **Contact ownership?**
   - Personal contacts per user?
   - Shared company contact database?
   - Both (personal + shared)?

5. **Admin control level?**
   - Can admins see all messages from all users?
   - Privacy for individual user communications?
   - Audit log requirements?

6. **Twilio credentials?**
   - Company provides one Twilio account for all?
   - Each user can use their own Twilio?
   - System provides Twilio (you resell SMS)?

### 🟢 NICE TO HAVE (can decide later):

7. **Advanced features?**
   - White-labeling for enterprise?
   - API access for integrations?
   - Webhooks for billing events?
   - Reseller program?

---

## Implementation Timeline Estimate

**Phase 1: Foundation** (2-3 weeks)
- Organization/Company table structure
- User invitation system
- Basic role-based permissions

**Phase 2: Billing** (2 weeks)
- Usage tracking and aggregation
- Invoice generation
- Stripe/Square integration for company billing

**Phase 3: Multi-User** (2-3 weeks)
- Shared resources (contacts, SMS pool)
- Permission enforcement
- Admin dashboard

**Phase 4: Advanced** (2-4 weeks)
- Team management
- Cost allocation
- Advanced reporting
- Usage alerts

---

## Next Steps

Please answer the critical questions above, and I'll create a detailed implementation plan with:
- Complete database schema
- API endpoint specifications
- UI mockup requirements
- Migration strategy from current single-user to multi-user

**Would you like to schedule a call to discuss these requirements in detail?**

