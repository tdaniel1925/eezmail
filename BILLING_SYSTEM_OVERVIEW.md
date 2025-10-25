# Billing System Overview

## Two-Tier Billing: SMS + AI Credits

Your platform bills for **two services**:
1. **SMS** - Twilio messaging
2. **AI** - OpenAI API calls

Both use the same flexible pricing architecture.

---

## Billing Architecture

### **Account Types:**

1. **Business/Master Accounts (Organizations)**
   - Law firms, companies
   - One master account, multiple users
   - All usage bills to master account
   - Admins see all communications

2. **Individual Accounts**
   - Personal users
   - Self-managed billing
   - Private communications

---

## SMS Billing

### **Pricing Hierarchy:**
```
1. Custom Pricing Override (admin-set per customer)
2. Subscription Plan Included SMS
3. Tier-Based Rate (standard/volume/enterprise/partner)
4. Global Default ($0.01/SMS)
```

### **Default Rates:**
- **Standard:** $0.0100/SMS
- **Volume:** $0.0085/SMS
- **Enterprise:** $0.0075/SMS
- **Partner:** $0.0050/SMS

### **Subscription Plans (with included SMS):**
- **Pay As You Go:** $0/mo, $0.01/SMS
- **Basic:** $29/mo, 1000 SMS, $0.009 overage
- **Pro:** $99/mo, 5000 SMS, $0.008 overage
- **Business Starter:** $99/mo, 2000 SMS
- **Business Pro:** $299/mo, 10000 SMS

---

## AI Billing

### **Pricing Hierarchy:**
```
1. Custom AI Pricing Override (admin-set per customer)
2. Subscription Plan Included Tokens
3. Global Default ($0.002/1k tokens)
```

### **Default Rate:**
- **$0.002 per 1,000 tokens** (approx $0.001/request for typical email reply)

### **Subscription Plans (with included AI tokens):**
- **Pay As You Go:** 10,000 tokens/mo
- **Basic:** 50,000 tokens/mo, $0.0018 overage
- **Pro:** 200,000 tokens/mo, $0.0015 overage
- **Business Starter:** 100,000 tokens/mo
- **Business Pro:** 500,000 tokens/mo, $0.0012 overage

### **AI Features Tracked:**
- Email reply generation
- Thread summarization
- Email classification
- Sentiment analysis
- Smart compose suggestions

---

## Billing Flow

### **When User Sends SMS:**
```typescript
1. Check user's organization (if any)
2. Get SMS rate (override > subscription > tier > default)
3. Check trial credits → Use if available
4. Check subscription → Use if SMS remaining
5. Charge balance (org or user)
6. Send SMS
7. Log transaction
```

### **When User Uses AI:**
```typescript
1. Check user's organization (if any)
2. Get AI rate (override > subscription > default)
3. Calculate cost (tokens / 1000 * rate)
4. Check trial credits → Use if available
5. Check subscription → Use if tokens remaining
6. Charge balance (org or user)
7. Make API call
8. Log transaction with actual token usage
```

---

## Trial Credits

### **SMS Trial:**
- Default: $5.00 (500 SMS @ $0.01)
- Duration: 30 days (configurable)
- Admin can grant custom amounts per customer

### **AI Trial:**
- Default: $10.00 (5,000 tokens)
- Duration: 30 days (configurable)
- Admin can grant custom amounts per customer

### **Trial Priority:**
Trial credits are used **before** subscription SMS/tokens and **before** paid balance.

---

## Platform Admin Controls

Admins can set pricing at **3 levels:**

### **1. Global Level (All Customers)**
```sql
-- Set default SMS rate
UPDATE platform_settings 
SET value = '{"rate": 0.0090, "currency": "USD"}'
WHERE key = 'sms_pricing_default';

-- Set default AI rate
UPDATE platform_settings 
SET value = '{"rate_per_1k_tokens": 0.0018, "currency": "USD"}'
WHERE key = 'ai_pricing_default';
```

### **2. Customer Level (Organization or Individual)**
```sql
-- Custom SMS pricing for Law Firm XYZ
INSERT INTO pricing_overrides (organization_id, sms_rate, reason)
VALUES ('org-123', 0.0075, 'Volume discount - 10k SMS/month');

-- Custom AI pricing for Enterprise customer
INSERT INTO ai_pricing_overrides (organization_id, rate_per_1k_tokens, reason)
VALUES ('org-123', 0.0012, 'Enterprise agreement');
```

### **3. Subscription Plan Level**
```sql
-- Create custom plan with SMS + AI included
INSERT INTO subscription_plans (
  name, plan_type, monthly_price, 
  sms_included, overage_rate,
  ai_tokens_included, ai_overage_rate
) VALUES (
  'Custom Enterprise', 'business', 499,
  25000, 0.0070,
  1000000, 0.0010
);
```

---

## Balance Tracking

### **Individual Users:**
- `users.sms_balance` - Prepaid SMS balance ($)
- `users.ai_balance` - Prepaid AI balance ($)
- `users.sms_trial_credits` - Free trial SMS
- `users.ai_trial_credits` - Free trial AI

### **Organizations:**
- `organizations.sms_balance` - Master account SMS balance
- `organizations.ai_balance` - Master account AI balance
- Trial credits at organization level

### **Unified Balance View:**
```sql
SELECT * FROM customer_balances WHERE user_id = 'user-123';
```
Returns:
- SMS balance, trial credits, subscription SMS remaining
- AI balance, trial credits, subscription tokens remaining
- Account type (organization/individual)
- Current plan

---

## Transaction Logging

### **SMS Transactions:**
```typescript
communication_logs table:
- user_id, organization_id
- cost, billed_to (user/org)
- charged_from (trial/subscription/balance)
- messageSid, delivery status
```

### **AI Transactions:**
```typescript
ai_transactions table:
- user_id, organization_id
- feature (email_reply, summarize, classify)
- model (gpt-4o-mini, gpt-4o)
- prompt_tokens, completion_tokens, total_tokens
- cost, billed_to, charged_from
- email_id, thread_id
```

---

## Usage Analytics

Platform admins can query:

### **Top SMS Users:**
```sql
SELECT user_id, COUNT(*), SUM(cost::numeric)
FROM communication_logs
WHERE type = 'sms_sent'
GROUP BY user_id
ORDER BY SUM(cost::numeric) DESC;
```

### **Top AI Users:**
```sql
SELECT user_id, feature, SUM(total_tokens), SUM(cost::numeric)
FROM ai_transactions
GROUP BY user_id, feature
ORDER BY SUM(cost::numeric) DESC;
```

### **Revenue by Customer:**
```sql
SELECT 
  customer_name,
  SUM(sms_cost) as sms_revenue,
  SUM(ai_cost) as ai_revenue,
  SUM(sms_cost + ai_cost) as total_revenue
FROM (
  SELECT 
    COALESCE(o.name, u.full_name) as customer_name,
    cl.cost as sms_cost,
    0 as ai_cost
  FROM communication_logs cl
  JOIN users u ON cl.user_id = u.id
  LEFT JOIN organizations o ON u.organization_id = o.id
  
  UNION ALL
  
  SELECT 
    COALESCE(o.name, u.full_name) as customer_name,
    0 as sms_cost,
    at.cost as ai_cost
  FROM ai_transactions at
  JOIN users u ON at.user_id = u.id
  LEFT JOIN organizations o ON u.organization_id = o.id
) revenue
GROUP BY customer_name
ORDER BY total_revenue DESC;
```

---

## Integration Points

### **SMS Sending (already integrated):**
```typescript
// src/lib/contacts/communication-actions.ts
await chargeSMS(userId, rate, {contactId, phone});
await sendSMS(phone, message);
```

### **AI Usage (to integrate):**
```typescript
// Before making OpenAI call:
const rate = await getAIRate(userId);
const estimatedTokens = estimateTokens(prompt);
const estimatedCost = calculateAICost(estimatedTokens, rate);

// Check if user has sufficient balance
const balance = await getCombinedBalance(userId);
if (balance.ai.balance + balance.ai.trialCredits < estimatedCost) {
  return { error: 'Insufficient AI balance' };
}

// Make OpenAI call
const response = await openai.chat.completions.create(...);

// Charge actual usage
await chargeAI(userId, response.usage.total_tokens, 'email_reply', 'gpt-4o-mini', {
  emailId: email.id,
  promptTokens: response.usage.prompt_tokens,
  completionTokens: response.usage.completion_tokens,
});
```

---

## Next Steps

1. ✅ Run `001_platform_admin_billing.sql`
2. ✅ Run `002_ai_credits_billing.sql`
3. ⏳ Seed your user as platform admin
4. ⏳ Build platform admin dashboard
5. ⏳ Integrate AI billing into OpenAI calls
6. ⏳ Add balance display to user dashboard

---

**Files:**
- `migrations/001_platform_admin_billing.sql`
- `migrations/002_ai_credits_billing.sql`
- `src/lib/billing/pricing.ts` (SMS)
- `src/lib/billing/ai-pricing.ts` (AI)
- `src/lib/contacts/communication-actions.ts` (SMS integrated)

