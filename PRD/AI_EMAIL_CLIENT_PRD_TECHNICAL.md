# AI Email Client - Technical Specifications & Architecture

[← Back to Overview](AI_EMAIL_CLIENT_PRD_OVERVIEW.md)

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Web App    │  │  Mobile App  │  │     API      │         │
│  │  (Next.js)   │  │ (React Native│  │  (Ext.     │         │
│  │              │  │   Future)    │  │  Integrations)│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │             Next.js Server Actions (API)                  │  │
│  │  • Email Operations    • AI Processing                   │  │
│  │  • Account Management  • Rule Execution                  │  │
│  │  • Search & Filtering  • Sync Orchestration              │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Email Sync │  │ AI Services  │  │    Rules     │         │
│  │   Engine     │  │   (GPT-4o)   │  │   Engine     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Auth & IAM  │  │   Webhooks   │  │  Background  │         │
│  │    (Clerk)   │  │   Manager    │  │    Jobs      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │     Redis    │  │  Object      │         │
│  │  (Supabase)  │  │   (Upstash)  │  │  Storage     │         │
│  │              │  │              │  │  (S3/R2)     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Gmail     │  │  Microsoft   │  │    Nylas     │         │
│  │     API      │  │   Graph API  │  │   (Unified)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   IMAP/SMTP  │  │   OpenAI     │  │   Twilio     │         │
│  │   Servers    │  │    API       │  │  (Future)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

### Frontend

**Framework:**
- **Next.js 14+** (App Router with React Server Components)
  - Server Components for data fetching (zero client-side JS for static content)
  - Client Components for interactivity
  - Streaming with Suspense for progressive loading
  - Parallel routes for multi-panel layouts

**UI Library:**
- **React 18+** with Concurrent Features
- **shadcn/ui** - Accessible component library built on Radix UI
- **Tailwind CSS 3+** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions

**State Management:**
- **TanStack Query (React Query)** - Server state management
  - Automatic caching and invalidation
  - Optimistic updates for instant UI feedback
  - Background refetching
- **Zustand** - Lightweight client state (UI state, selected emails, etc.)
- **React Context** - Theme, user preferences

**Data Fetching:**
- Server Actions (type-safe, no API routes needed)
- SWR for real-time data (alternative to React Query)
- Webhook-based push updates (Socket.io for real-time sync)

**Forms & Validation:**
- **React Hook Form** - Performance form library
- **Zod** - TypeScript-first schema validation

**Rich Text Editing:**
- **TipTap** or **Lexical** - Modern rich text editor
  - AI integration for writing assistance
  - Markdown support
  - Collaborative editing ready (future)

**Drag & Drop:**
- **dnd-kit** - Modern drag-and-drop toolkit
  - Email organization (labels, folders)
  - Email prioritization (drag to reorder)

---

### Backend

**Framework:**
- **Next.js 14+ Server Actions** - Type-safe API endpoints
  - No separate API layer needed
  - Direct database access from server components
  - Automatic request deduplication

**Database:**
- **PostgreSQL 15+** via **Supabase**
  - Full-text search with `tsvector`
  - JSONB for flexible data (email addresses, AI insights)
  - Row-Level Security (RLS) for multi-tenancy
  - Real-time subscriptions (optional)

**ORM:**
- **Drizzle ORM** - Type-safe SQL toolkit
  - Zero-cost abstractions
  - Automatic TypeScript types from schema
  - Migration generation
  - Prepared statements for performance

**Caching:**
- **Redis** via **Upstash** (Serverless Redis)
  - AI response caching (summaries, quick replies)
  - Session storage
  - Rate limiting
  - Pub/sub for real-time updates

**Background Jobs:**
- **BullMQ** + Redis for job queues
  - Email sync jobs (scheduled)
  - AI processing (batch generation)
  - Webhook retry logic
  - Email sending queue

**File Storage:**
- **S3-compatible** storage (AWS S3, Cloudflare R2, Backblaze B2)
  - Email attachments
  - User uploads
  - CDN integration for fast delivery

---

### Email Infrastructure

**Multi-Provider Strategy:**

**Option 1: Nylas Unified API (Recommended)**
- Single API for Gmail, Outlook, Yahoo, AOL, IMAP
- OAuth flow handled by Nylas
- Webhooks for real-time sync
- Attachment handling
- **Cost:** $9/user/month (billed to us, hidden from user)

**Option 2: Direct Integration (Cost-effective, Complex)**
- Gmail API (OAuth 2.0)
- Microsoft Graph API (OAuth 2.0)
- Custom IMAP/SMTP clients (Yahoo, AOL, custom domains)
- **Cost:** Free (except infrastructure)
- **Complexity:** High (multiple API implementations)

**Hybrid Approach (Best):**
- Nylas for OAuth providers (Gmail, Outlook) - simplicity
- Custom IMAP/SMTP for others - cost savings
- Fallback logic (Nylas → IMAP if quota exceeded)

**Email Sync Engine:**
```typescript
// Sync strategies by provider

Gmail/Outlook (via Nylas):
  → Webhook-based (< 5 seconds latency)
  → Fallback: Poll every 2 minutes

IMAP Providers:
  → IDLE connection (real-time push)
  → Fallback: Poll every 5 minutes

All Providers:
  → Cron job every 30 minutes (safety net)
  → Manual sync button (user-triggered)
```

---

### AI/ML Services

**Primary AI Provider: OpenAI**

**Models:**
- **GPT-4o** - Email summaries, draft generation, copilot
  - Temperature: 0.7 (balanced creativity/accuracy)
  - Max tokens: 1000 for summaries, 2000 for drafts
  - Streaming responses for copilot

**AI Operations:**

**1. Email Summarization**
```typescript
Input: Email subject, body, thread context
Output: 2-3 sentence summary
Latency: < 2 seconds (pre-generated in background)
Cost: $0.003 per email (GPT-4o input: 500 tokens, output: 100 tokens)
Caching: 7 days
```

**2. Quick Reply Generation**
```typescript
Input: Email content, sender context, user writing style
Output: 3 reply suggestions (brief, medium, detailed)
Latency: < 3 seconds
Cost: $0.005 per email
Caching: 24 hours
```

**3. Email Classification**
```typescript
Input: Email headers, body, sender patterns
Output: Category (imbox, feed, paper_trail), confidence score
Latency: < 1 second (rule-based + AI hybrid)
Cost: $0.001 per email (lightweight model)
Caching: Permanent (classification stored in DB)
```

**4. Smart Actions**
```typescript
Input: Email content, user context
Output: Contextual actions (schedule meeting, add to tasks, etc.)
Latency: < 2 seconds
Cost: $0.002 per email
Caching: 24 hours
```

**5. Copilot (Conversational)**
```typescript
Input: User query, selected email, conversation history
Output: Streaming text response
Latency: 500ms (first token), 3-5 seconds (full response)
Cost: $0.01 per conversation turn
Caching: Session-based (not cached)
```

**Cost Optimization:**
- Pre-generate AI for visible emails only (viewport-based)
- Batch processing during off-peak hours
- Hybrid approach: Rules first, AI for ambiguous cases
- User settings: Disable AI features to reduce costs

**Fallback Strategy:**
```typescript
if (OpenAI fails):
  → Use rule-based heuristics
  → Cache previous AI results
  → Show "AI unavailable" message
  → Queue for retry (3 attempts)
```

---

### Authentication & Security

**Authentication Provider: Clerk**

**Features:**
- Email/password signup
- Social OAuth (Google, Microsoft, GitHub)
- Magic link login
- Multi-factor authentication (2FA)
- Session management
- User profile management

**Authorization:**
```typescript
// Multi-tenant access control
User → Email Accounts (1:N)
User → Only access own accounts (enforced at DB level)

// Team features (future)
Organization → Users (N:M)
Organization → Shared Inboxes
```

**Encryption:**
```typescript
// Credential encryption (AES-256-GCM)
const encrypt = (plaintext: string): string => {
  const key = process.env.ENCRYPTION_KEY; // 32-byte key
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

// Decrypt on-demand (never logs decrypted value)
const decrypt = (ciphertext: string): string => {
  // Decryption logic
};
```

**Security Best Practices:**
- All credentials encrypted at rest
- OAuth preferred over password storage
- Encrypted database connections (TLS 1.3)
- Rate limiting on API endpoints
- CSRF protection
- XSS prevention (Content Security Policy)
- SQL injection prevention (parameterized queries)

---

## 📡 API Architecture

### Server Actions (Next.js)

**Example Action:**
```typescript
// actions/email-operations-actions.ts

'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/db';
import { emailsTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function archiveEmailAction(emailId: string) {
  try {
    // 1. Authentication
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Authorization (verify email belongs to user)
    const email = await db.query.emailsTable.findFirst({
      where: eq(emailsTable.id, emailId),
      with: { account: true },
    });

    if (!email || email.account.userId !== userId) {
      return { success: false, error: 'Email not found' };
    }

    // 3. Business logic
    await db
      .update(emailsTable)
      .set({
        folderName: 'archive',
        updatedAt: new Date(),
      })
      .where(eq(emailsTable.id, emailId));

    // 4. Cache invalidation
    revalidatePath('/dashboard/emails');

    return { success: true };
  } catch (error: any) {
    console.error('Error archiving email:', error);
    return { success: false, error: error.message };
  }
}
```

**Action Patterns:**

```typescript
// 1. Query Action (Read)
export async function getEmailsAction(
  accountId: string,
  filters: EmailFilters
): Promise<{ success: boolean; emails?: Email[]; error?: string }> {
  // ...
}

// 2. Mutation Action (Write)
export async function sendEmailAction(
  draft: DraftEmail
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  // ...
}

// 3. Streaming Action (AI)
export async function streamAICopilotAction(
  query: string,
  context: EmailContext
): Promise<ReadableStream> {
  // Stream GPT-4o response
}
```

---

## 🔄 Real-Time Sync Architecture

### Sync Strategies

**1. Webhook-Based (Preferred)**
```
Email Provider → Webhook → Next.js API Route → Process Email → Update DB → Notify Client
```

**Providers:**
- Gmail: Pub/Sub via Google Cloud
- Microsoft: Graph API webhooks
- Nylas: Unified webhooks for all providers

**Webhook Handler:**
```typescript
// app/api/webhooks/email/route.ts

export async function POST(req: Request) {
  // 1. Verify webhook signature
  const signature = req.headers.get('X-Webhook-Signature');
  if (!verifySignature(signature, await req.text())) {
    return new Response('Invalid signature', { status: 401 });
  }

  // 2. Parse webhook payload
  const payload = await req.json();
  const { accountId, messageId, event } = payload;

  // 3. Process event
  if (event === 'message.created') {
    await syncNewEmail(accountId, messageId);
  }

  // 4. Notify client (via WebSocket or Server-Sent Events)
  await notifyClient(accountId, { type: 'new_email', messageId });

  return new Response('OK', { status: 200 });
}
```

**2. IMAP IDLE (Real-Time Push)**
```typescript
// lib/email-sync/imap-idle-client.ts

class IMAPIdleClient {
  async startIdle(accountId: string) {
    const connection = await this.connect(accountId);
    
    // Listen for new emails
    connection.on('mail', async (numNew) => {
      console.log(`${numNew} new emails received`);
      await this.fetchNewEmails(accountId, numNew);
    });

    // Start IDLE mode
    await connection.idle();
  }

  async fetchNewEmails(accountId: string, count: number) {
    // Fetch and process new emails
  }
}
```

**3. Polling (Fallback)**
```typescript
// app/api/cron/sync-emails/route.ts

export async function GET(req: Request) {
  // Verify Vercel Cron secret
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get all active accounts
  const accounts = await db.query.emailAccountsTable.findMany({
    where: eq(emailAccountsTable.status, 'active'),
  });

  // Sync each account
  for (const account of accounts) {
    await syncAccountEmails(account.id);
  }

  return Response.json({ synced: accounts.length });
}
```

**Vercel Cron Configuration:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-emails",
      "schedule": "*/5 * * * *" // Every 5 minutes
    },
    {
      "path": "/api/cron/process-ai-queue",
      "schedule": "*/2 * * * *" // Every 2 minutes
    }
  ]
}
```

---

## 🤖 Background Job Processing

### Job Queue Architecture

**BullMQ + Redis:**

```typescript
// lib/jobs/queue.ts

import { Queue, Worker } from 'bullmq';
import { Redis } from '@upstash/redis';

// Job queues
export const emailSyncQueue = new Queue('email-sync', {
  connection: redis,
});

export const aiProcessingQueue = new Queue('ai-processing', {
  connection: redis,
});

// Worker: Email Sync
const syncWorker = new Worker('email-sync', async (job) => {
  const { accountId } = job.data;
  await syncAccountEmails(accountId);
}, {
  connection: redis,
  concurrency: 5, // Process 5 accounts concurrently
});

// Worker: AI Processing (Batch)
const aiWorker = new Worker('ai-processing', async (job) => {
  const { emailIds } = job.data;
  await generateAIForEmails(emailIds);
}, {
  connection: redis,
  concurrency: 3, // Limit concurrent AI requests
});
```

**Job Types:**

| Job | Purpose | Frequency | Priority |
|-----|---------|-----------|----------|
| `email-sync` | Fetch new emails from provider | Every 5 min | High |
| `ai-processing` | Generate AI summaries, replies | On-demand | Medium |
| `send-email` | Send queued outgoing emails | Immediate | High |
| `scheduled-send` | Send scheduled emails | At scheduled time | High |
| `cleanup-old-emails` | Archive/delete old emails (retention) | Daily | Low |
| `webhook-retry` | Retry failed webhooks | 1h, 6h, 24h | Medium |

**Job Retry Logic:**
```typescript
emailSyncQueue.add('sync', { accountId }, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000, // Start at 1 second, then 2s, 4s, 8s...
  },
});
```

---

## 🔍 Search Architecture

### Full-Text Search

**PostgreSQL tsvector:**

```sql
-- Add search vector column
ALTER TABLE emails ADD COLUMN search_vector tsvector;

-- Create GIN index for fast search
CREATE INDEX emails_search_vector_idx 
  ON emails USING GIN(search_vector);

-- Update search vector on insert/update
CREATE OR REPLACE FUNCTION emails_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.subject, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.body_text, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.from_address->>'name', '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emails_search_vector_trigger
  BEFORE INSERT OR UPDATE ON emails
  FOR EACH ROW EXECUTE FUNCTION emails_search_vector_update();
```

**Search Query:**
```typescript
// lib/email-search.ts

export async function searchEmails(
  accountId: string,
  query: string
): Promise<Email[]> {
  const results = await db.execute(sql`
    SELECT
      id,
      subject,
      snippet,
      from_address,
      received_at,
      ts_rank(search_vector, to_tsquery('english', ${query})) AS rank
    FROM emails
    WHERE
      account_id = ${accountId}
      AND search_vector @@ to_tsquery('english', ${query})
    ORDER BY rank DESC, received_at DESC
    LIMIT 50
  `);

  return results.rows;
}
```

**Natural Language Parsing:**
```typescript
// Convert "emails from john last week" to filters

const parseNaturalLanguage = (query: string): EmailFilters => {
  const filters: EmailFilters = {};

  // Extract sender
  const fromMatch = query.match(/from (\w+)/i);
  if (fromMatch) filters.from = fromMatch[1];

  // Extract date range
  if (query.includes('today')) {
    filters.dateRange = { start: startOfDay(new Date()), end: new Date() };
  } else if (query.includes('last week')) {
    filters.dateRange = { start: subDays(new Date(), 7), end: new Date() };
  }

  // Extract flags
  if (query.includes('unread')) filters.isRead = false;
  if (query.includes('starred')) filters.isStarred = true;
  if (query.includes('has attachment')) filters.hasAttachments = true;

  return filters;
};
```

### Semantic Search (Future)

**Vector Embeddings:**
```typescript
// Use OpenAI embeddings for semantic similarity

const getEmbedding = async (text: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
};

// Store in pgvector
// ALTER TABLE emails ADD COLUMN embedding vector(1536);
// CREATE INDEX emails_embedding_idx ON emails USING ivfflat (embedding vector_cosine_ops);

// Semantic search query
const results = await db.execute(sql`
  SELECT * FROM emails
  WHERE account_id = ${accountId}
  ORDER BY embedding <-> ${queryEmbedding}
  LIMIT 20
`);
```

---

## 📊 Performance Optimization

### Caching Strategy

**Multi-Layer Cache:**

**1. Browser Cache (Client-Side)**
```typescript
// TanStack Query caching
const { data: emails } = useQuery({
  queryKey: ['emails', accountId, filters],
  queryFn: () => getEmailsAction(accountId, filters),
  staleTime: 30 * 1000, // 30 seconds
  cacheTime: 5 * 60 * 1000, // 5 minutes
});
```

**2. Redis Cache (Server-Side)**
```typescript
// Cache AI responses
const getCachedAISummary = async (emailId: string): Promise<string | null> => {
  const cached = await redis.get(`ai:summary:${emailId}`);
  if (cached) return cached;

  // Generate and cache
  const summary = await generateAISummary(emailId);
  await redis.setex(`ai:summary:${emailId}`, 7 * 24 * 60 * 60, summary); // 7 days
  
  return summary;
};
```

**3. Database Cache (Materialized Views)**
```sql
-- Pre-computed email counts per folder
CREATE MATERIALIZED VIEW email_counts AS
  SELECT
    account_id,
    folder_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_read = false) as unread
  FROM emails
  GROUP BY account_id, folder_name;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY email_counts;
```

### Code Splitting & Lazy Loading

```typescript
// components/email/email-layout.tsx

// Lazy load heavy components
const EmailViewer = lazy(() => import('./email-viewer'));
const EmailComposer = lazy(() => import('./email-composer'));
const AICopilotPanel = lazy(() => import('./email-copilot-panel'));

// Load only when needed
<Suspense fallback={<EmailViewerSkeleton />}>
  {selectedEmail && <EmailViewer email={selectedEmail} />}
</Suspense>
```

### Image Optimization

```typescript
// Next.js Image component with CDN
import Image from 'next/image';

<Image
  src={attachment.storageUrl}
  alt={attachment.filename}
  width={800}
  height={600}
  quality={85}
  placeholder="blur"
  loading="lazy"
/>
```

### Virtual Scrolling

```typescript
// Render only visible emails (for 1000+ emails)
import { useVirtualizer } from '@tanstack/react-virtual';

const EmailCardList = ({ emails }: { emails: Email[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: emails.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Height of email card
    overscan: 10, // Render 10 extra items for smooth scrolling
  });

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <EmailCard email={emails[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🚀 Deployment

### Infrastructure

**Hosting: Vercel**
- Auto-scaling (1-100 instances)
- Edge functions (globally distributed)
- Automatic HTTPS
- Preview deployments (PRs)
- Zero-config CDN

**Database: Supabase**
- Managed PostgreSQL 15+
- Auto-backups (hourly)
- Point-in-time recovery
- Connection pooling
- 99.9% uptime SLA

**Redis: Upstash**
- Serverless Redis
- Per-request pricing (cost-effective)
- Global replication
- REST API (HTTP-based)

**Object Storage: Cloudflare R2**
- S3-compatible API
- Zero egress fees
- Fast CDN
- $0.015/GB/month

**Monitoring: Sentry + Vercel Analytics**
- Error tracking
- Performance monitoring
- Real User Monitoring (RUM)
- Custom alerts

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_POOL_URL=postgresql://... # For serverless

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Auth
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...

# Email Providers
NYLAS_CLIENT_ID=...
NYLAS_CLIENT_SECRET=...
NYLAS_API_KEY=...

GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...

MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...

# AI
OPENAI_API_KEY=...

# Object Storage
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
S3_REGION=...

# Security
ENCRYPTION_KEY=... # 32-byte hex string for AES-256
WEBHOOK_SECRET=... # For verifying webhooks

# Cron
CRON_SECRET=... # For protecting cron endpoints
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📈 Scalability

### Bottlenecks & Solutions

| Bottleneck | Solution |
|------------|----------|
| **Database connections** | Connection pooling (Supabase Pooler), read replicas |
| **AI API rate limits** | Queue system, rate limiting, batch processing |
| **Email sync latency** | Webhooks > IDLE > Polling, background jobs |
| **Large attachments** | Stream to object storage, CDN delivery |
| **Search performance** | Full-text indexes, caching, materialized views |
| **Real-time updates** | WebSockets / Server-Sent Events, Redis pub/sub |

### Horizontal Scaling

```
User Load:
  1-100 users → 1 Vercel instance, 1 DB, 1 Redis
  100-1K users → 5-10 instances, 2 DB replicas, 1 Redis
  1K-10K users → 20-50 instances, 5 DB replicas, 3 Redis shards
  10K+ users → Auto-scale, read replicas, sharded DB, Redis cluster
```

---

**Next Documents:**
- [← Back to Overview](AI_EMAIL_CLIENT_PRD_OVERVIEW.md)
- [UI/UX Guidelines →](AI_EMAIL_CLIENT_PRD_DESIGN.md)
- [Data Models →](AI_EMAIL_CLIENT_PRD_DATA_MODELS.md)
- [Feature Requirements →](AI_EMAIL_CLIENT_PRD_FEATURES.md)

