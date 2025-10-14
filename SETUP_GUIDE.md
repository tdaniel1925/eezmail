# Imbox Setup Guide

Complete setup instructions for the Imbox AI Email Client.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Stripe Configuration](#stripe-configuration)
5. [Square Configuration](#square-configuration)
6. [Local Development](#local-development)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([nodejs.org](https://nodejs.org))
- **npm** (comes with Node.js)
- **Git** for version control
- A **Supabase** account ([supabase.com](https://supabase.com))
- A **Stripe** account ([stripe.com](https://stripe.com))
- A **Square** account ([squareup.com](https://squareup.com))
- A code editor (VS Code recommended)

## Initial Setup

### 1. Clone the Repository

\`\`\`bash
git clone <your-repo-url>
cd win-email_client
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

This will install all required packages including Next.js, React, Supabase, Stripe, Square, and more.

### 3. Create Environment File

Copy the example environment file:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

## Supabase Configuration

### 1. Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: imbox-production (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"

### 2. Get API Keys

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values to your `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret!

### 3. Set Up Database

1. Go to **SQL Editor** in your Supabase dashboard
2. Run this SQL to create tables:

\`\`\`sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'team', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE payment_processor AS ENUM ('stripe', 'square');

-- Users table
CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
email TEXT NOT NULL UNIQUE,
full_name TEXT,
avatar_url TEXT,
subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
subscription_status subscription_status,
payment_processor payment_processor,
stripe_customer_id TEXT,
square_customer_id TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Subscriptions table
CREATE TABLE subscriptions (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES users(id) NOT NULL,
tier subscription_tier NOT NULL,
status subscription_status NOT NULL,
processor payment_processor NOT NULL,
processor_subscription_id TEXT NOT NULL,
current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
cancel_at_period_end BOOLEAN DEFAULT false,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Email accounts table (for future)
CREATE TABLE email_accounts (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES users(id) NOT NULL,
email TEXT NOT NULL,
provider TEXT NOT NULL,
access_token TEXT,
refresh_token TEXT,
is_active BOOLEAN DEFAULT true,
last_sync_at TIMESTAMP WITH TIME ZONE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own email accounts" ON email_accounts FOR SELECT USING (auth.uid() = user_id);
\`\`\`

### 4. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. Optional: Configure **OAuth providers** (Google, Microsoft) for email connections later

## Stripe Configuration

### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification

### 2. Get API Keys

1. Go to [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Toggle **Test mode** (top right)
3. Copy keys to `.env.local`:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

### 3. Create Products and Prices

1. Go to **Products** → **Add product**

**Pro Plan:**

- Name: Imbox Pro
- Description: Unlimited email accounts and AI features
- Pricing: $15/month recurring
- Copy the **Price ID** → `STRIPE_PRICE_ID_PRO_MONTHLY`

**Team Plan:**

- Name: Imbox Team
- Description: All Pro features + team collaboration
- Pricing: $12/month recurring
- Copy the **Price ID** → `STRIPE_PRICE_ID_TEAM_MONTHLY`

### 4. Set Up Webhooks

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
3. Listen to these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 5. Test Webhooks Locally

Install Stripe CLI:

\`\`\`bash

# Forward webhooks to local server

stripe listen --forward-to localhost:3000/api/webhooks/stripe
\`\`\`

## Square Configuration

### 1. Create Square Developer Account

1. Go to [developer.squareup.com](https://developer.squareup.com)
2. Sign in or create account

### 2. Create Application

1. Go to **Applications**
2. Click **+** to create new application
3. Name it "Imbox" and save

### 3. Get API Keys

1. Go to your application → **Credentials**
2. Toggle **Sandbox** mode
3. Copy to `.env.local`:
   - **Application ID** → `NEXT_PUBLIC_SQUARE_APPLICATION_ID`
   - **Access Token** → `SQUARE_ACCESS_TOKEN`
4. Copy **Location ID** → `NEXT_PUBLIC_SQUARE_LOCATION_ID`

### 4. Create Subscription Plans

1. Go to **Square Dashboard** → **Items & Orders** → **Subscriptions**
2. Create subscription plans:

**Pro Plan:**

- Name: Imbox Pro Monthly
- Price: $15/month
- Copy **Plan ID** → `SQUARE_PLAN_ID_PRO_MONTHLY`

**Team Plan:**

- Name: Imbox Team Monthly
- Price: $12/month
- Copy **Plan ID** → `SQUARE_PLAN_ID_TEAM_MONTHLY`

### 5. Set Up Webhooks

1. Go to **Webhooks** → **Add subscription**
2. Notification URL: `https://your-domain.com/api/webhooks/square`
3. Select events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
4. Copy **Signature Key** → `SQUARE_WEBHOOK_SIGNATURE_KEY`

## Local Development

### 1. Verify Environment Variables

Double-check your `.env.local` has all required values:

\`\`\`bash

# Check file exists and has content

cat .env.local
\`\`\`

### 2. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 3. Test Authentication

1. Go to `/signup`
2. Create a test account
3. Verify you're redirected to `/dashboard`
4. Check Supabase dashboard for new user

### 4. Test Type Checking

\`\`\`bash

# Run TypeScript check

npm run type-check

# Should show no errors

\`\`\`

## Deployment

### Deploy to Vercel

#### 1. Push to GitHub

\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

#### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: .next

#### 3. Add Environment Variables

In Vercel project settings → **Environment Variables**, add all variables from `.env.local`:

**Supabase:**

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

**Stripe:**

- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID_PRO_MONTHLY
- STRIPE_PRICE_ID_TEAM_MONTHLY

**Square:**

- NEXT_PUBLIC_SQUARE_APPLICATION_ID
- NEXT_PUBLIC_SQUARE_LOCATION_ID
- SQUARE_ACCESS_TOKEN
- SQUARE_WEBHOOK_SIGNATURE_KEY
- SQUARE_ENVIRONMENT (set to "production")
- SQUARE_PLAN_ID_PRO_MONTHLY
- SQUARE_PLAN_ID_TEAM_MONTHLY

**App:**

- NEXT_PUBLIC_APP_URL (your Vercel domain)

#### 4. Deploy

Click **Deploy** and wait for build to complete.

#### 5. Update Webhooks

Update webhook URLs in Stripe and Square to point to your production domain.

## Troubleshooting

### TypeScript Errors

Run type checking:
\`\`\`bash
npm run type-check
\`\`\`

Common fixes:

- Restart VS Code TypeScript server
- Delete `.next` and rebuild

### Authentication Issues

- Verify Supabase keys are correct
- Check browser console for errors
- Ensure middleware is running

### Payment Issues

**Stripe:**

- Test with card: 4242 4242 4242 4242
- Check webhook signing secret matches

**Square:**

- Use Sandbox mode for testing
- Verify Location ID is correct

### Build Errors

\`\`\`bash

# Clear cache and rebuild

rm -rf .next
npm run build
\`\`\`

## Next Steps

1. ✅ Basic setup complete
2. 📧 Implement email sync (Nylas or IMAP)
3. 🤖 Add AI features (OpenAI integration)
4. 🎨 Build dashboard UI
5. 📱 Create email views

See [PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md) for payment details.

## Support

Need help? Check:

- GitHub Issues
- Documentation files in `/PRD/`
- Email: support@imbox.com
