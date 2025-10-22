# Redis Implementation Plan - Performance Optimization

## 🎯 Current Status

**Before the crash, we were working on implementing Redis caching to improve performance.**

### What's Already Built ✅

1. **Redis Client** (`src/lib/redis/client.ts`)
   - ✅ Upstash Redis integration
   - ✅ Type-safe cache functions (get, set, delete)
   - ✅ Distributed locks
   - ✅ TTL support
   - ✅ Cache key builders for all data types

2. **Redis Cache Service** (`src/lib/cache/redis-cache.ts`)
   - ✅ Email list caching
   - ✅ Email detail caching
   - ✅ Search results caching
   - ✅ AI summary caching
   - ✅ AI quick replies caching
   - ✅ Folder counts caching
   - ✅ Cache invalidation functions

3. **Rate Limiter** (`src/lib/sync/rate-limiter.ts`)
   - ✅ Redis-based distributed rate limiting
   - ✅ Fallback to in-memory if Redis unavailable
   - ✅ Email provider-specific limits

4. **Package Dependencies**
   - ✅ `@upstash/redis` v1.35.6 installed

### What's Missing ⏳

1. **Environment Variables** - Need to be configured:

   ```env
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

2. **Integration** - Cache functions not yet used in components:
   - Email list queries still fetch directly from DB
   - AI features not using cache
   - No cache invalidation on mutations

3. **Testing** - Need to verify:
   - Redis connection works
   - Cache hit rates
   - Performance improvements

---

## 📋 Implementation Plan

### Phase 1: Setup & Configuration (15 minutes)

#### Step 1: Create Upstash Redis Account

1. Go to [upstash.com](https://upstash.com)
2. Sign up (free tier: 10K commands/day)
3. Create new Redis database:
   - Name: `imbox-email-cache`
   - Region: Choose closest to Vercel deployment
   - Type: **REST API** (required for serverless)

#### Step 2: Get Credentials

Copy these values from Upstash dashboard:

- **REST API URL**: `UPSTASH_REDIS_REST_URL`
- **REST API Token**: `UPSTASH_REDIS_REST_TOKEN`

#### Step 3: Add to Environment Variables

**Local Development** - Create `.env.local`:

```env
# Redis (Upstash) - REQUIRED FOR CACHING
UPSTASH_REDIS_REST_URL=https://your-redis-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx...xxxxx

# Enable caching
CACHE_ENABLED=true
```

**Production** - Add to Vercel:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Set for: Production, Preview, Development

#### Step 4: Test Connection

```bash
npm run dev
# Visit: http://localhost:3000/api/test-redis (create this endpoint)
```

---

### Phase 2: Integrate Email Caching (30 minutes)

#### Update Email Query Functions

**File: `src/lib/email/get-emails.ts`**

```typescript
import {
  getCachedEmailList,
  invalidateUserEmailCache,
} from '@/lib/cache/redis-cache';

export async function getInboxEmails(
  userId: string,
  limit: number = 25,
  skipCache: boolean = false
) {
  return await getCachedEmailList(
    userId,
    'inbox',
    1,
    async () => {
      // Existing database query
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', userId)
        .eq('folder_name', 'INBOX')
        .order('received_at', { ascending: false })
        .limit(limit);

      return data || [];
    },
    { ttl: 180, skipCache } // Cache for 3 minutes
  );
}
```

#### Update All Email Query Functions

- `getEmails()`
- `getEmailsByFolder()`
- `getEmailsByCategory()`
- `getUnscreenedEmails()`
- `getSentEmails()`
- etc.

---

### Phase 3: Integrate AI Caching (20 minutes)

#### Update AI Summary Generation

**File: `src/lib/ai/thread-analyzer.ts`**

```typescript
import { getCachedAISummary } from '@/lib/cache/redis-cache';

export async function generateThreadSummary(emailId: string) {
  return await getCachedAISummary(
    emailId,
    async () => {
      // Existing OpenAI call
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          /* ... */
        ],
      });
      return completion.choices[0].message.content;
    },
    { ttl: 604800 } // Cache for 7 days
  );
}
```

#### Update AI Quick Replies

**File: `src/app/api/ai/quick-replies/route.ts`**

```typescript
import { getCachedAIReplies } from '@/lib/cache/redis-cache';

export async function POST(request: Request) {
  const { emailId } = await request.json();

  const replies = await getCachedAIReplies(
    emailId,
    async () => {
      // Existing OpenAI call to generate replies
      return generatedReplies;
    },
    { ttl: 3600 } // Cache for 1 hour
  );

  return NextResponse.json({ replies });
}
```

---

### Phase 4: Cache Invalidation (20 minutes)

#### Invalidate on Email Sync

**File: `src/lib/sync/email-sync-service.ts`**

```typescript
import { invalidateUserEmailCache } from '@/lib/cache/redis-cache';

export async function syncAccount(accountId: string) {
  // ... existing sync logic ...

  // After successful sync, invalidate cache
  await invalidateUserEmailCache(userId);

  return { success: true };
}
```

#### Invalidate on Email Actions

**Files to update:**

- `src/app/api/email/archive/route.ts`
- `src/app/api/email/delete/route.ts`
- `src/app/api/email/star/route.ts`
- `src/app/api/email/send/route.ts`

Add after each action:

```typescript
await invalidateUserEmailCache(userId);
await invalidateEmailCache(emailId);
```

---

### Phase 5: Testing & Monitoring (15 minutes)

#### Create Test Endpoint

**File: `src/app/api/test-redis/route.ts` (NEW)**

```typescript
import { NextResponse } from 'next/server';
import {
  testRedisConnection,
  setCached,
  getCached,
  redis,
} from '@/lib/redis/client';

export async function GET() {
  try {
    // Test connection
    const connected = await testRedisConnection();

    // Test set/get
    const testKey = 'test:connection';
    await setCached(testKey, { timestamp: Date.now() }, 60);
    const retrieved = await getCached(testKey);

    // Get Redis info
    const info = await redis.info();

    return NextResponse.json({
      success: true,
      connected,
      testData: retrieved,
      redisInfo: info,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

#### Monitor Cache Performance

Add logging to cache functions:

```typescript
console.log('[Cache] Hit:', key);
console.log('[Cache] Miss:', key);
console.log('[Cache] Invalidated:', pattern);
```

#### Track Metrics

- Cache hit rate
- Average response time
- Redis memory usage
- Cost per day

---

## 📊 Expected Performance Improvements

### Before Redis (Current State)

| Operation     | Time       | Cache   |
| ------------- | ---------- | ------- |
| Load inbox    | 500-1000ms | ❌ None |
| Email search  | 300-800ms  | ❌ None |
| AI summary    | 2-5s       | ❌ None |
| Quick replies | 3-6s       | ❌ None |
| Folder counts | 200-400ms  | ❌ None |

### After Redis (Target State)

| Operation              | Time        | Cache     | Improvement       |
| ---------------------- | ----------- | --------- | ----------------- |
| Load inbox (cached)    | **10-50ms** | ✅ 3 min  | **90-95% faster** |
| Email search (cached)  | **10-30ms** | ✅ 5 min  | **95-97% faster** |
| AI summary (cached)    | **10-20ms** | ✅ 7 days | **99% faster**    |
| Quick replies (cached) | **10-20ms** | ✅ 1 hour | **99% faster**    |
| Folder counts (cached) | **10-20ms** | ✅ 1 min  | **95% faster**    |

### User Experience Impact

- **First visit**: Same speed (cache miss)
- **Repeat visits**: **10-20x faster** (cache hit)
- **Navigation**: Instant switching between folders
- **AI features**: Instant on repeat use
- **Search**: Near-instant for repeated queries

---

## 💰 Cost Analysis

### Upstash Redis Pricing

**Free Tier:**

- 10,000 commands/day
- 256 MB storage
- Perfect for development & testing

**Pro Tier:** ~$10-15/month

- 500,000 commands/day
- 10 GB storage
- Suitable for production

### Expected Usage

**Per User Per Day:**

- Email list queries: ~50 commands
- AI features: ~20 commands
- Folder counts: ~30 commands
- **Total**: ~100 commands/user/day

**For 100 Active Users:**

- 100 users × 100 commands = 10,000/day
- Fits in free tier! 🎉

**For 1,000 Active Users:**

- 1,000 users × 100 commands = 100,000/day
- Need Pro tier (~$10-15/month)

### Cost Savings

**Reduced Database Load:**

- 80-90% fewer PostgreSQL queries
- Lower Supabase costs
- Better performance

**Reduced API Costs:**

- Cached AI responses
- 99% fewer OpenAI API calls for repeat queries
- **Save $30-50/month** on OpenAI

**ROI:**

- Redis cost: $10-15/month
- Savings: $30-50/month (OpenAI) + better UX
- **Net positive ROI**

---

## 🚨 Fallback Strategy

The code already has fallback logic:

```typescript
const useRedis = !!process.env.UPSTASH_REDIS_REST_URL;

if (useRedis) {
  // Try Redis
  try {
    return await getCached(key);
  } catch (error) {
    console.error('Redis error, falling back:', error);
    // Fall through to database
  }
}

// Fallback: Query database directly
return await fetchFromDatabase();
```

**Benefits:**

- App works without Redis
- Graceful degradation
- No breaking changes

---

## ✅ Verification Checklist

After implementation:

- [ ] Redis connection test passes
- [ ] Email list caching works (check logs for cache hits)
- [ ] AI summaries cached (repeated requests instant)
- [ ] Cache invalidation works (new emails appear after sync)
- [ ] Folder counts cached (sidebar loads instantly)
- [ ] Search results cached
- [ ] Rate limiting uses Redis
- [ ] Fallback to database works if Redis fails
- [ ] Upstash dashboard shows commands
- [ ] Performance improvement measured (before/after)

---

## 📝 Summary

### What We Have

- ✅ Complete Redis client implementation
- ✅ Cache service with all helper functions
- ✅ Rate limiter with Redis support
- ✅ Cache key builders for all data types
- ✅ Distributed lock support
- ✅ Graceful fallback logic

### What You Need To Do

1. **Create Upstash account** (5 min)
2. **Add environment variables** (2 min)
3. **Update email queries** (20 min)
4. **Update AI functions** (15 min)
5. **Add cache invalidation** (15 min)
6. **Test & verify** (10 min)

**Total Time**: ~1-1.5 hours

### Expected Outcome

- ⚡ **10-20x faster** repeat visits
- 💰 **$20-40/month savings** on API costs
- 📈 **90% cache hit rate** within days
- 😊 **Much better user experience**

---

## 🚀 Next Steps

**Ready to implement?**

1. I'll create the Upstash account setup guide
2. Help you add environment variables
3. Update all the email query functions
4. Integrate AI caching
5. Add cache invalidation
6. Test everything
7. Monitor performance

**Just say "let's do it" and I'll start with Step 1!** 🎯

---

**Status**: ⏳ **Waiting for your Upstash credentials**
**Last Updated**: October 22, 2025
**Estimated Completion**: 1-1.5 hours
