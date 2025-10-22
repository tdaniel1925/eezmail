# Stack Setup Guide - Complete Environment Configuration

## 🎯 Overview

This guide covers all services and environment variables needed for the Imbox AI Email Client with full stack optimization and AI features.

---

## 📋 Services to Set Up

### 1. Upstash Redis (Required)

**Purpose:** Distributed caching, rate limiting, job queues

**Setup:**

1. Go to [upstash.com](https://upstash.com)
2. Create account (free tier available)
3. Create Redis database
   - Select region closest to your users
   - Choose "REST API" option
4. Copy credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**Cost:** Free tier: 10K commands/day | Pro: ~$10-15/month

---

### 2. Sentry (Optional but Recommended)

**Purpose:** Error tracking, performance monitoring

**Setup:**

1. Go to [sentry.io](https://sentry.io)
2. Create account
3. Create new project → Select "Next.js"
4. Copy DSN key
5. Get auth token from Settings → Auth Tokens

**Cost:** Free tier: 5K errors/month | Pro: $26/month

---

### 3. Vercel Analytics (Free)

**Purpose:** Web analytics, speed insights

**Setup:**

1. Already included if deployed on Vercel
2. Enable in Vercel dashboard → Project Settings → Analytics
3. No environment variables needed

**Cost:** Free on all Vercel plans

---

### 4. OpenAI API (Required for AI Features)

**Purpose:** AI summaries, replies, embeddings

**Setup:**

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Add payment method (pay-as-you-go)

**Cost:** ~$50-100/month with heavy AI usage

- Embeddings: $0.0001/1K tokens
- GPT-4: $0.03/1K tokens input
- GPT-4o-mini: $0.000150/1K tokens input

---

### 5. Anthropic Claude (Optional)

**Purpose:** Long context AI analysis (200K tokens)

**Setup:**

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create API key

**Cost:** ~$30-50/month (optional)

---

### 6. Supabase (Already Set Up)

**Purpose:** Database, Auth, Storage

**Setup:**
✅ Already configured

- Verify `email-attachments` bucket exists
- Enable `vector` extension for pgvector

---

## 🔑 Environment Variables

Create `.env.local` file with these variables:

```env
# ===========================================
# EXISTING - Already Configured
# ===========================================

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (AI Features)
OPENAI_API_KEY=sk-...

# Google OAuth (Gmail)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Microsoft OAuth (Outlook)
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=common

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===========================================
# NEW - To Be Configured
# ===========================================

# Redis (Upstash) - REQUIRED
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Sentry (Optional but Recommended)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Anthropic Claude (Optional)
ANTHROPIC_API_KEY=sk-ant-...

# Feature Flags
CACHE_ENABLED=true
VECTOR_SEARCH_ENABLED=true
AI_AUTOPILOT_ENABLED=true
AI_WRITING_COACH_ENABLED=true
RAG_ENABLED=true
BULK_INTELLIGENCE_ENABLED=true
SECURITY_AI_ENABLED=true

# ===========================================
# OPTIONAL - Advanced Features
# ===========================================

# Cloudflare R2 (Alternative attachment storage)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=email-attachments
```

---

## 🗄️ Database Setup

### Run SQL Migrations

Connect to your Supabase database and run these migrations:

#### 1. Enable pgvector Extension

```sql
-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 2. Add Embedding Column

```sql
-- Add embedding column to emails table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create vector index for fast similarity search
CREATE INDEX IF NOT EXISTS emails_embedding_idx
ON emails USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

#### 3. Add Performance Indexes

```sql
-- Inbox query optimization
CREATE INDEX IF NOT EXISTS idx_emails_category_date
ON emails(email_category, received_at DESC)
WHERE email_category IS NOT NULL;

-- Attachment queries
CREATE INDEX IF NOT EXISTS idx_attachments_email
ON email_attachments(email_id)
INCLUDE (filename, size, content_type, storage_url);

-- Sync operations
CREATE INDEX IF NOT EXISTS idx_emails_account_folder
ON emails(account_id, folder_name, received_at DESC);

-- Search queries by sender
CREATE INDEX IF NOT EXISTS idx_emails_sender
ON emails(account_id, sender_email, received_at DESC);

-- Unread emails
CREATE INDEX IF NOT EXISTS idx_emails_unread
ON emails(account_id, is_read, received_at DESC)
WHERE is_read = false;

-- Full-text search
CREATE INDEX IF NOT EXISTS emails_fulltext_idx
ON emails USING GIN(to_tsvector('english', COALESCE(subject, '') || ' ' || COALESCE(body_text, '')));
```

#### 4. Add AI Tables

```sql
-- Autopilot rules
CREATE TABLE IF NOT EXISTS autopilot_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  trust_level TEXT NOT NULL DEFAULT 'suggest',
  confidence FLOAT DEFAULT 0.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI actions log
CREATE TABLE IF NOT EXISTS ai_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  rule_id UUID REFERENCES autopilot_rules(id) ON DELETE SET NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  undone_at TIMESTAMP,
  metadata JSONB
);

-- Email templates
CREATE TABLE IF NOT EXISTS ai_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_body TEXT NOT NULL,
  variables JSONB,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics
CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value FLOAT NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- User behavior patterns
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  sender TEXT,
  pattern JSONB NOT NULL,
  confidence INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_autopilot_rules_user
ON autopilot_rules(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_ai_actions_log_user
ON ai_actions_log(user_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_templates_user
ON ai_email_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_email_analytics_user
ON email_analytics(user_id, metric_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_behavior_patterns_user
ON user_behavior_patterns(user_id, pattern_type);
```

---

## ✅ Verification Checklist

### Test Redis Connection

```typescript
import { testRedisConnection } from '@/lib/redis/client';

const isConnected = await testRedisConnection();
console.log('Redis connected:', isConnected);
```

### Test Embedding Generation

```typescript
import { generateEmbedding, isEmbeddingConfigured } from '@/lib/rag/embeddings';

const configured = isEmbeddingConfigured();
if (configured) {
  const embedding = await generateEmbedding('Test email content');
  console.log('Embedding dimensions:', embedding.length); // Should be 1536
}
```

### Verify Database Tables

```sql
-- Check if all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'emails',
  'email_attachments',
  'autopilot_rules',
  'ai_actions_log',
  'ai_email_templates',
  'email_analytics',
  'user_behavior_patterns'
);

-- Check if vector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if embedding column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'emails' AND column_name = 'embedding';
```

---

## 🚀 Deploy to Vercel

### 1. Add Environment Variables

Go to Vercel Dashboard → Project → Settings → Environment Variables

Add all variables from `.env.local` above.

### 2. Update vercel.json

Ensure cron jobs are configured (already done in codebase).

### 3. Deploy

```bash
git push # Vercel auto-deploys from main branch
```

---

## 💰 Cost Summary

| Service              | Tier     | Monthly Cost      |
| -------------------- | -------- | ----------------- |
| Supabase             | Pro      | $25               |
| Upstash Redis        | Free/Pro | $0-15             |
| Sentry               | Free/Pro | $0-26             |
| OpenAI API           | Usage    | $50-100           |
| Anthropic (Optional) | Usage    | $0-50             |
| Vercel               | Pro      | $20               |
| **Total**            |          | **$95-236/month** |

### Cost Optimization Tips:

1. Start with free tiers (Upstash, Sentry)
2. Monitor OpenAI usage, optimize prompts
3. Use GPT-4o-mini instead of GPT-4 where possible
4. Cache AI responses aggressively
5. Implement rate limiting for AI features

---

## 🐛 Troubleshooting

### Redis Connection Issues

```bash
# Test Redis connection
curl https://your-redis.upstash.io \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Sentry Not Capturing Errors

- Verify DSN is correct
- Check if environment matches (development/production)
- Look for errors in browser console

### Vector Search Not Working

- Verify `vector` extension is enabled
- Check if embeddings are being generated (run cron job)
- Verify embedding column has data

### Rate Limiting Issues

- Check Redis connectivity
- Verify rate limit keys are being created
- Monitor Redis dashboard for request counts

---

## 📚 Additional Resources

- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Supabase pgvector Guide](https://supabase.com/docs/guides/ai)
- [Vercel Analytics Docs](https://vercel.com/docs/analytics)

---

## 🎯 Next Steps

After setup is complete:

1. Run database migrations
2. Test Redis connection
3. Generate test data
4. Test AI features
5. Monitor costs and performance
6. Optimize based on usage patterns

---

**Setup Status:** ⏳ In Progress
**Last Updated:** October 21, 2025
**Support:** Check IMPLEMENTATION_AUDIT.md for implementation details
