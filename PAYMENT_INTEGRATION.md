# Payment Integration Guide

How Imbox's dual payment processing works with Stripe and Square.

## Overview

Imbox supports **two payment processors** to give users flexibility:

- **Stripe** - Popular, global, great for developers
- **Square** - Used by merchants, integrated with POS systems

Users can choose their preferred processor during checkout.

## Architecture

### Payment Flow

```
User selects plan
    ↓
Chooses processor (Stripe or Square)
    ↓
Creates checkout session
    ↓
Completes payment
    ↓
Webhook processes event
    ↓
Database updated
    ↓
User gains access
```

### Database Schema

Each user has:

- `payment_processor`: 'stripe' | 'square' | null
- `stripe_customer_id`: Stripe customer ID (if using Stripe)
- `square_customer_id`: Square customer ID (if using Square)
- `subscription_tier`: 'free' | 'pro' | 'team'
- `subscription_status`: 'active' | 'canceled' | 'past_due' | 'trialing'

The `subscriptions` table stores:

- Which processor owns the subscription
- External subscription ID
- Current period dates
- Cancel status

## Implementation Details

### Stripe Integration

**Client Flow:**

1. User clicks "Subscribe to Pro" (Stripe)
2. `CheckoutButton` calls `/api/stripe/create-checkout-session`
3. Server creates Stripe Checkout Session
4. User redirected to Stripe hosted checkout
5. After payment, redirected back to app

**Server Flow:**

1. Stripe sends webhook to `/api/webhooks/stripe`
2. Webhook handler verifies signature
3. Processes events:
   - `checkout.session.completed` - Links customer to user
   - `customer.subscription.created/updated` - Updates subscription
   - `customer.subscription.deleted` - Cancels subscription
   - `invoice.payment_failed` - Marks as past_due
4. Updates Supabase database

**Code Location:**

- Client: `src/components/stripe/CheckoutButton.tsx`
- Server: `src/lib/stripe/server.ts`
- Webhook: `src/app/api/webhooks/stripe/route.ts`
- Plans: `src/lib/stripe/plans.ts`

### Square Integration

**Client Flow:**

1. User clicks "Subscribe to Pro" (Square)
2. `CheckoutForm` calls `/api/square/create-subscription`
3. Server creates or retrieves Square Customer
4. Creates Square Subscription
5. Subscription activates immediately (or requires payment method)

**Server Flow:**

1. Square sends webhook to `/api/webhooks/square`
2. Webhook handler verifies HMAC signature
3. Processes events:
   - `subscription.created/updated` - Updates subscription
   - `subscription.canceled` - Cancels subscription
4. Updates Supabase database

**Code Location:**

- Client: `src/components/square/CheckoutForm.tsx`
- Server: `src/lib/square/server.ts`
- Webhook: `src/app/api/webhooks/square/route.ts`
- Plans: `src/lib/square/plans.ts`

## Testing

### Test Stripe Locally

1. Install Stripe CLI:
   \`\`\`bash
   brew install stripe/stripe-cli/stripe

# or download from stripe.com/docs/stripe-cli

\`\`\`

2. Login:
   \`\`\`bash
   stripe login
   \`\`\`

3. Forward webhooks:
   \`\`\`bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   \`\`\`

4. Use test card: `4242 4242 4242 4242`

### Test Square Locally

1. Use Square Sandbox environment
2. Set `SQUARE_ENVIRONMENT=sandbox`
3. Use ngrok for local webhook testing:
   \`\`\`bash
   ngrok http 3000

# Update Square webhook URL to ngrok URL

\`\`\`

4. Use Square test card numbers (see Square docs)

### Test Scenarios

**Happy Path:**

1. ✅ User signs up
2. ✅ Selects plan
3. ✅ Completes payment
4. ✅ Webhook processes
5. ✅ User tier updated
6. ✅ Dashboard shows Pro features

**Edge Cases:**

- ❌ Payment fails → User stays on Free tier
- ⚠️ Webhook delayed → Retry mechanism handles it
- 🔄 User cancels → Subscription marked `cancel_at_period_end`
- 💳 Card expires → Invoice fails, status → `past_due`

## Security

### Stripe Webhook Verification

\`\`\`typescript
// Verify signature
const signature = headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
body,
signature,
process.env.STRIPE_WEBHOOK_SECRET
);
\`\`\`

Never process webhooks without signature verification!

### Square Webhook Verification

\`\`\`typescript
// Verify HMAC
const hmac = crypto.createHmac('sha256', SQUARE_WEBHOOK_SIGNATURE_KEY);
hmac.update(body);
const hash = hmac.digest('base64');

if (hash !== signature) {
throw new Error('Invalid signature');
}
\`\`\`

### API Key Security

- ✅ Use environment variables
- ✅ Never commit `.env.local`
- ✅ Rotate keys periodically
- ✅ Use test keys in development
- ✅ Restrict key permissions in production

## Handling Edge Cases

### Duplicate Webhooks

Stripe and Square may send duplicate webhooks. Handle idempotently:

\`\`\`typescript
// Use upsert to handle duplicates
await supabase.from('subscriptions').upsert({
processor_subscription_id: subscription.id, // unique key
// ... other fields
});
\`\`\`

### Webhook Failures

If webhook processing fails:

1. Processor retries automatically (Stripe: up to 3 days)
2. Check webhook logs in dashboard
3. Manually replay webhook if needed

### Refunds

**Stripe:**

- Handled through Stripe Dashboard
- Or via API: `stripe.refunds.create()`

**Square:**

- Handled through Square Dashboard
- Subscription refund requires manual adjustment

### Prorations

**Stripe:**

- Automatic proration on plan changes
- Configure in Stripe Dashboard → Billing → Settings

**Square:**

- No automatic proration
- Handle manually or disable plan changes

## Migration Between Processors

If user wants to switch from Stripe to Square (or vice versa):

1. Cancel existing subscription
2. Wait for cancellation confirmation
3. Create new subscription with new processor
4. Update `payment_processor` field
5. Retain both customer IDs for history

## Production Checklist

### Before Launch

- [ ] Test all payment flows end-to-end
- [ ] Verify webhook signatures
- [ ] Set up error monitoring (Sentry)
- [ ] Configure webhook retry logic
- [ ] Test refund scenarios
- [ ] Verify subscription cancellation
- [ ] Test payment failure handling
- [ ] Set up customer support email

### Stripe Production

- [ ] Switch from Test to Live mode
- [ ] Update API keys in `.env.local`
- [ ] Update webhook endpoints
- [ ] Verify products and prices exist
- [ ] Test with real card (small amount)
- [ ] Enable fraud detection (Radar)

### Square Production

- [ ] Switch from Sandbox to Production
- [ ] Update access token
- [ ] Update webhook URLs
- [ ] Verify subscription plans exist
- [ ] Test with real payment

## Monitoring

### Key Metrics to Track

**Stripe Dashboard:**

- MRR (Monthly Recurring Revenue)
- Churn rate
- Failed payments
- Successful subscriptions

**Square Dashboard:**

- Subscription count
- Revenue
- Failed payments
- Active customers

**Custom Analytics:**
\`\`\`sql
-- Count subscriptions by processor
SELECT processor, COUNT(\*)
FROM subscriptions
WHERE status = 'active'
GROUP BY processor;

-- Revenue by tier
SELECT tier, COUNT(_) _
CASE tier
WHEN 'pro' THEN 15
WHEN 'team' THEN 12
ELSE 0
END as monthly_revenue
FROM subscriptions
WHERE status = 'active'
GROUP BY tier;
\`\`\`

## Common Issues

### "Webhook signature verification failed"

**Cause:** Signing secret mismatch

**Fix:**

1. Check `.env.local` has correct secret
2. Verify endpoint URL in dashboard
3. For Stripe CLI, use the webhook secret shown in terminal

### "Customer not found"

**Cause:** Customer ID doesn't exist in processor

**Fix:**

1. Check database has correct customer_id
2. Verify customer exists in Stripe/Square dashboard
3. Re-create customer if needed

### "Subscription already exists"

**Cause:** User already has active subscription

**Fix:**

1. Check existing subscription status
2. Cancel old subscription first
3. Or upgrade/downgrade instead

### "Payment method required"

**Cause:** Square subscription needs payment method

**Fix:**

1. Collect payment method before creating subscription
2. Use Square Web Payments SDK
3. Or send invoice for payment

## API Reference

### Stripe Endpoints

\`\`\`
POST /api/stripe/create-checkout-session
POST /api/stripe/create-portal-session
POST /api/webhooks/stripe
\`\`\`

### Square Endpoints

\`\`\`
POST /api/square/create-subscription
POST /api/square/cancel-subscription
POST /api/webhooks/square
\`\`\`

## Resources

**Stripe:**

- [Stripe Docs](https://stripe.com/docs)
- [Webhook Events](https://stripe.com/docs/api/events)
- [Testing](https://stripe.com/docs/testing)

**Square:**

- [Square Docs](https://developer.squareup.com/docs)
- [Subscriptions API](https://developer.squareup.com/docs/subscriptions-api/overview)
- [Webhooks](https://developer.squareup.com/docs/webhooks)

## Support

Questions about payment integration?

- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Review PRD: [AI_EMAIL_CLIENT_PRD_TECHNICAL.md](./PRD/AI_EMAIL_CLIENT_PRD_TECHNICAL.md)
- Email: dev@imbox.com
