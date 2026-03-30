# La Tribuna — Scalability Analysis: 50,000 Concurrent Users

> Date: March 2026 | Current estimated safe capacity: ~500 concurrent users

---

## Executive Summary

La Tribuna's current architecture cannot support 50,000 concurrent users. The system has **critical bottlenecks** in the leaderboard computation (O(members^2) per request), scoring throughput (sequential DB writes per winner), and real-time event distribution (500ms polling over HTTP REST). This document maps every bottleneck, quantifies the gap, and provides a prioritized remediation plan.

---

## 1. Database Layer (PostgreSQL via Neon + Prisma)

### 1.1 Connection Pooling

**Current state:** PrismaClient with default pool (~10-20 connections). No explicit `connection_limit` configured.

**Problem at 50K:** Each API request acquires at least 1 connection. Default pool of 20 means only 20 requests execute concurrently — everything else queues and times out after 5 seconds.

**Target:** 300+ pooled connections across read/write paths.

**Fix:**
```env
# .env — Neon pooler connection with explicit limit
DATABASE_URL="postgresql://...?connection_limit=100&pool_timeout=10"
```

Also configure Prisma datasource pool:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Consider PgBouncer or Neon's built-in pooler in transaction mode for serverless scale.

### 1.2 Missing Indexes

The schema has **zero indexes on foreign keys** used in hot queries. This causes full table scans on tables that will reach millions of rows.

| Table         | Column(s)                  | Query Origin                        | Impact              |
| ------------- | -------------------------- | ----------------------------------- | ------------------- |
| `Answer`      | `questionId`               | scoring.ts, leaderboard.ts          | 500K+ row scans     |
| `Answer`      | `(userId, questionId)`     | trivia/route.ts (user's answers)    | Per-request scan    |
| `Prediction`  | `questionId`               | scoring.ts, leaderboard.ts          | 500K+ row scans     |
| `Prediction`  | `(userId, questionId)`     | trivia/route.ts                     | Per-request scan    |
| `LeagueMember`| `leagueId`                 | Every league endpoint               | N+1 on all leagues  |
| `LeagueMember`| `(leagueId, userId)`       | Member checks                       | Auth on every req   |
| `Checkin`     | `(businessId, checkedAt)`  | send-scheduled-promos cron          | Time-range scans    |
| `Notification`| `userId`                   | Notifications page                  | Unbounded scans     |

**Fix** — Add to `schema.prisma`:
```prisma
model Answer {
  // ... existing fields
  @@index([questionId])
  @@index([userId, questionId])
}

model Prediction {
  // ... existing fields
  @@index([questionId])
  @@index([userId, questionId])
}

model LeagueMember {
  // ... existing fields
  @@index([leagueId])
  @@index([leagueId, userId])
}

model Checkin {
  // ... existing fields
  @@index([businessId, checkedAt])
}

model Notification {
  // ... existing fields
  @@index([userId])
}
```

**Effort:** 1 hour. **Impact:** Immediate 10-100x query speedup on hot paths.

### 1.3 Table Growth Projections

| Table         | Rows at 50K users (1 season) | Without indexes   | With indexes     |
| ------------- | ---------------------------- | ----------------- | ---------------- |
| Answer        | 50M+                         | 2-5s per query    | <10ms per query  |
| Prediction    | 10M+                         | 1-3s per query    | <10ms per query  |
| LeagueMember  | 500K+                        | 200ms per query   | <5ms per query   |
| Notification  | 5M+                          | 500ms per query   | <10ms per query  |

Consider **table partitioning** by date or league for Answer/Prediction tables once they exceed 100M rows.

---

## 2. Leaderboard Endpoint (CRITICAL)

**File:** `app/api/leagues/[id]/leaderboard/route.ts`

### Current Implementation

The endpoint loads ALL matches, ALL members, ALL questions, ALL answers, and ALL predictions for the entire league, then computes cumulative rankings in a triple-nested loop.

### Complexity Analysis

```
For a league with M matches, U members, Q questions:

Data loaded:
  - M leagueMatches
  - U members with user data
  - Q questions (M × ~10 = ~500)
  - Q × U answers (~500 × 5000 = 2.5M records)
  - Q × U predictions

Computation:
  - Build per-match points: O(answers + predictions) = O(2.5M)
  - Cumulative ranking loop: O(M × U × M/2) = O(M^2 × U)
  - Sort per match: O(M × U log U)

  Total: O(M^2 × U + U × M log U)

  With M=50, U=5000:
  O(50^2 × 5000) = O(12.5 million operations) PER REQUEST
```

At 100 concurrent leaderboard requests: **1.25 billion operations/second**. This endpoint alone will crash the server.

### Fix: Denormalize + Cache + Paginate

**Step 1 — Denormalize points into LeagueMember:**
```prisma
model LeagueMember {
  totalPoints   Int   @default(0)  // Already exists
  pointsByMatch Json? // NEW: { "matchId": 45, "matchId2": 30, ... }
}
```

Update `pointsByMatch` inside `scoreQuestionAnswers()` and `scorePredictions()` — the data is already computed there.

**Step 2 — Cache the leaderboard:**
```typescript
const cacheKey = `leaderboard:${leagueId}:${matchId || 'all'}`
const cached = await cacheGet(cacheKey)
if (cached) return NextResponse.json(cached)

// ... compute ...
await cacheSet(cacheKey, result, 60) // 60-second TTL
```

**Step 3 — Paginate:**
```typescript
const page = parseInt(searchParams.get('page') || '1')
const limit = 50
const members = await prisma.leagueMember.findMany({
  where: { leagueId },
  orderBy: { totalPoints: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
})
```

**Result:** O(1) for cached reads, O(U log U) worst case for cache miss with pagination.

---

## 3. Scoring Throughput (CRITICAL)

**File:** `lib/scoring.ts`

### Current Pattern

When a question resolves, `scoreQuestionAnswers()` loops through every correct answer and executes **5 sequential DB operations per winner**:

```
Per winner:
  1. answer.update()        — mark as correct
  2. creditWallet()         — wallet transaction
  3. leagueMember.update()  — add points
  4. awardXp()              — 2-3 queries (read user, update user)
  5. updateStreak()         — 2 queries (read, update)
```

Plus 1 extra query per winner to check presential multiplier (checkin lookup).

### At Scale

```
1000 correct answers × 8 DB ops = 8,000 sequential writes
10 questions per match × 8,000 = 80,000 writes per match
50 concurrent matches = 4,000,000 writes per peak window

PostgreSQL throughput: ~10,000-50,000 writes/sec
Time to score one question: 8,000 / 10,000 = 0.8 seconds minimum
Time for all 10 questions: 8 seconds of pure DB writes
```

This blocks the database for other requests during scoring.

### Fix: Batch + Defer + Pre-compute

**Step 1 — Batch correct answers in a single transaction:**
```typescript
await prisma.$transaction(async (tx) => {
  // Mark all correct answers at once
  await tx.answer.updateMany({
    where: { id: { in: correctAnswerIds } },
    data: { isCorrect: true, pointsAwarded: basePoints },
  })

  // Batch wallet credits
  await tx.walletTransaction.createMany({
    data: correctOnes.map(p => ({
      walletId: p.walletId,
      amount: p.points,
      type: 'CREDIT',
    }))
  })

  // Batch league member point updates
  for (const p of correctOnes) {
    await tx.leagueMember.updateMany({
      where: { leagueId, userId: p.userId },
      data: { totalPoints: { increment: p.points } },
    })
  }
})
```

**Step 2 — Defer XP and streak updates to a queue:**
```typescript
// Instead of immediate DB writes per winner:
await redis.rpush('xp-queue', JSON.stringify(
  correctOnes.map(p => ({ userId: p.userId, xp: 5 }))
))
// Separate worker processes bulk XP updates every 5 seconds
```

**Step 3 — Pre-fetch presential multipliers once:**
```typescript
// Before the loop, fetch all active checkins for this business
const activeCheckins = new Set(
  (await prisma.checkin.findMany({
    where: { businessId, checkedAt: { gte: twoHoursAgo } },
    select: { userId: true },
  })).map(c => c.userId)
)
// Then O(1) lookup per winner instead of O(1 query) per winner
```

**Result:** Scoring drops from 8,000 queries to ~10-20 queries per question resolution.

---

## 4. Real-Time Event System

**Files:** `lib/socket-emit.ts`, `socket-server/index.ts`

### Current Architecture

```
Next.js API → redis.rpush('lt:socket:events', event)
                              ↓
Socket server polls every 500ms → redis.lpop(10 events)
                              ↓
Socket.io broadcasts to rooms
```

### Problems at 50K

| Issue                      | Current               | Required              |
| -------------------------- | --------------------- | --------------------- |
| Event delivery latency     | 0-500ms (polling)     | <100ms                |
| Redis interface            | HTTP REST (Upstash)   | Native TCP or Streams |
| Socket server instances    | 1                     | 5-10                  |
| WebSocket connections      | ~500 max              | 50,000                |
| Memory per server          | ~256MB                | ~2GB per instance     |

### Fix: Redis Adapter + Streams + Horizontal Scaling

**Step 1 — Replace polling with Redis Pub/Sub or Streams:**
```typescript
// socket-server/index.ts — Replace setInterval polling
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

const pubClient = createClient({ url: REDIS_URL })
const subClient = pubClient.duplicate()
await Promise.all([pubClient.connect(), subClient.connect()])

io.adapter(createAdapter(pubClient, subClient))
```

This enables:
- **Instant event delivery** (pub/sub, no polling)
- **Multi-server** socket distribution (rooms replicated across servers)
- **Horizontal scaling** — add more socket servers behind a load balancer

**Step 2 — Replace event list with Redis Streams:**
```typescript
// lib/socket-emit.ts
await redis.xadd('lt:socket:events', '*', { data: JSON.stringify(event) })

// socket-server/index.ts
// Use XREADGROUP for consumer groups — no events lost, ordered delivery
```

**Step 3 — Deploy multiple socket servers:**
```
Load Balancer (sticky sessions by userId)
  ├─ socket-server-1 (10K connections)
  ├─ socket-server-2 (10K connections)
  ├─ socket-server-3 (10K connections)
  ├─ socket-server-4 (10K connections)
  └─ socket-server-5 (10K connections)
```

Each Socket.io server can handle ~10,000 WebSocket connections with 2GB RAM.

---

## 5. Redis Caching Layer

**File:** `lib/redis.ts`

### Current Issues

| Issue                       | Impact                                          |
| --------------------------- | ----------------------------------------------- |
| No TTL on any cache key     | Memory grows unbounded, stale data persists      |
| Upstash HTTP REST API       | 50-200ms per operation (vs 1-5ms native TCP)     |
| No cache warming            | Cold start on first request of a match           |
| No pipeline batching        | Each operation is a separate HTTP roundtrip       |

### Recommended TTLs

| Cache Key Pattern                    | TTL      | Reason                                        |
| ------------------------------------ | -------- | --------------------------------------------- |
| `matches:live`                       | 30s      | Refreshed by sync-matches cron every 60s      |
| `leaderboard:{leagueId}:{matchId}`   | 60s      | Frequently changing during live match          |
| `leaderboard:{leagueId}:all`         | 300s     | Historical, less volatile                     |
| `wallet:balance:{userId}`            | 120s     | Eventually consistent is acceptable           |
| `venue:checkins:{businessId}`        | 60s      | Active during match                           |
| `leagues:public:{page}`              | 3600s    | Rarely changes                                |

### Infrastructure Upgrade Path

| Users       | Redis Solution                  | Estimated Cost   |
| ----------- | ------------------------------- | ---------------- |
| 0 - 1,000   | Upstash Free/Pro                | $0-10/mo         |
| 1K - 10K    | Upstash Enterprise or Redis Cloud | $50-200/mo     |
| 10K - 50K   | Self-hosted Redis Cluster (3 nodes) | $200-500/mo  |
| 50K+        | Redis Cluster + Read Replicas    | $500+/mo        |

---

## 6. Authentication & Sessions

**File:** `lib/auth.ts`

### Current Strategy

NextAuth v5 with JWT strategy. Session is extended with `id`, `role`, `level`, `xp` in the JWT token itself. This is already serverless-friendly.

### Issue at Scale

The `session` callback (lines 60-75) runs on every authenticated request and decodes the JWT. This is CPU-bound, not DB-bound — acceptable. However:

- **PrismaAdapter** still creates Session records in the DB for OAuth providers
- At 50K concurrent users refreshing sessions: potential DB pressure

### Fix

Ensure JWT-only strategy (no DB session table):
```typescript
session: { strategy: 'jwt' } // Already configured
```

Verify the adapter doesn't create session rows for JWT-only mode. If it does, switch to a minimal adapter or remove session model from schema.

---

## 7. Cron Jobs at Scale

**Directory:** `app/api/cron/`

| Job                    | Current Risk | Fix                                                |
| ---------------------- | ------------ | -------------------------------------------------- |
| `sync-matches`         | LOW          | Fine — bounded by API-Football rate limits          |
| `resolve-predictions`  | MEDIUM       | Add index on `(matchId, status)`. Batch resolution. |
| `send-scheduled-promos`| HIGH         | `groupBy` + `having` is expensive. Pre-compute.     |
| `close-questions`      | LOW          | Single `updateMany`, efficient.                     |
| `calculate-battle`     | HIGH         | Per-participant queries. Batch with aggregations.    |
| `update-streaks`       | LOW          | Single `updateMany`, runs daily.                    |

**Important note from CLAUDE.md:** Cron jobs are NOT registered in `vercel.json` (Hobby plan limit). They must be triggered externally. At 50K users, these need reliable scheduling (e.g., Railway cron, GitHub Actions, or a dedicated worker).

---

## 8. Next.js API Layer

### Current: Single Vercel Deployment

Vercel serverless functions have:
- **10-second timeout** (Hobby) / **60-second timeout** (Pro)
- **Cold start latency**: 200-500ms per function
- **Concurrent execution limit**: 1000 (Pro plan)

### At 50K Users

Peak request rate during a live match with 50K users:
```
Answer submissions:  ~2,500/sec (5K users × 0.5 answers/sec)
Leaderboard reads:   ~500/sec
Trivia page loads:   ~1,000/sec
Other API calls:     ~500/sec
Total:               ~4,500 requests/sec
```

Vercel Pro handles ~1,000 concurrent executions. With avg 200ms response time:
- Throughput: 1000 / 0.2 = 5,000 req/sec — **barely sufficient**
- Any slow query (leaderboard!) blocks a slot for seconds

### Fix

- **Vercel Pro plan** minimum ($20/mo per team member)
- **Edge functions** for read-heavy endpoints (leaderboard, match data)
- **Rate limiting** already partially implemented (lib/redis.ts has ratelimit import)
- Consider self-hosted Next.js on Railway/Fly.io for more control over concurrency

---

## 9. Prioritized Action Plan

### Phase 1 — Quick Wins (Week 1, ~4 hours)

| Action                          | Effort  | Impact                        |
| ------------------------------- | ------- | ----------------------------- |
| Add 8 database indexes          | 1 hour  | 10-100x query speedup         |
| Set connection pool to 100      | 30 min  | 5x concurrent request capacity |
| Add TTLs to all cache keys      | 1 hour  | Prevent memory bloat           |
| Cache leaderboard for 60s       | 1 hour  | Eliminate O(n^2) on most reads |

**Estimated capacity after Phase 1: ~2,000-5,000 concurrent users**

### Phase 2 — Scoring & Leaderboard Refactor (Week 2-3, ~20 hours)

| Action                              | Effort   | Impact                        |
| ----------------------------------- | -------- | ----------------------------- |
| Batch scoring in transactions       | 6 hours  | 100x fewer DB writes          |
| Defer XP/streak to async queue      | 4 hours  | Unblock scoring path          |
| Denormalize pointsByMatch           | 4 hours  | O(1) leaderboard reads        |
| Paginate leaderboard endpoint       | 3 hours  | Bounded response size         |
| Pre-fetch checkin multipliers       | 3 hours  | 1000x fewer queries in scoring|

**Estimated capacity after Phase 2: ~10,000-20,000 concurrent users**

### Phase 3 — Real-Time Infrastructure (Week 4-5, ~16 hours)

| Action                              | Effort   | Impact                        |
| ----------------------------------- | -------- | ----------------------------- |
| Socket.io Redis adapter             | 4 hours  | Multi-server socket support   |
| Replace polling with pub/sub        | 4 hours  | <100ms event latency          |
| Deploy 3-5 socket server instances  | 4 hours  | 50K WebSocket connections     |
| Upgrade Redis to cluster/dedicated  | 4 hours  | Native TCP, lower latency     |

**Estimated capacity after Phase 3: ~50,000 concurrent users**

### Phase 4 — Hardening (Week 6-8)

| Action                              | Effort   | Impact                        |
| ----------------------------------- | -------- | ----------------------------- |
| Read replicas for PostgreSQL        | 4 hours  | 3x read throughput            |
| Table partitioning (Answer, Prediction) | 8 hours | Sustained performance at 100M+ rows |
| Load testing with k6 or Artillery   | 8 hours  | Validate all improvements     |
| Rate limiting on all public endpoints| 4 hours  | DDoS protection               |
| Monitoring & alerting (Grafana)     | 8 hours  | Visibility into bottlenecks   |

---

## 10. Target Architecture

```
                    50,000 Users
                         |
                   [CDN / Edge]
                    (static assets, cached API responses)
                         |
                 [Load Balancer]
                /        |        \
        [Next.js ×3]  [Next.js ×3]  [Next.js ×3]
         (API + SSR)   (API + SSR)   (API + SSR)
                \        |        /
                 [PgBouncer Pool]
                /                 \
    [PostgreSQL Primary]    [Read Replica ×2]
         (writes)              (leaderboard, trivia reads)
                         |
                 [Redis Cluster ×3]
              (cache, pub/sub, queues)
                /        |        \
    [Socket.io ×5]  [Socket.io ×5]  (via Redis adapter)
         (10K conn each = 50K total)
                         |
                  [XP/Streak Worker]
              (async queue processor)
```

### Estimated Monthly Infrastructure Cost

| Component               | Service              | Cost         |
| ----------------------- | -------------------- | ------------ |
| Next.js hosting (9 inst)| Railway / Fly.io     | $150-300/mo  |
| PostgreSQL + replicas   | Neon Pro / Supabase  | $100-300/mo  |
| Redis Cluster           | Redis Cloud / Upstash Enterprise | $100-200/mo |
| Socket servers (5 inst) | Railway              | $50-100/mo   |
| CDN                     | Vercel / Cloudflare  | $20-50/mo    |
| Monitoring              | Grafana Cloud        | $0-50/mo     |
| **Total**               |                      | **$420-1,000/mo** |

---

## 11. Key Metrics to Monitor

| Metric                          | Threshold (alert)      | Tool               |
| ------------------------------- | ---------------------- | ------------------- |
| DB connection pool utilization  | > 80%                  | Neon dashboard      |
| Query p99 latency               | > 500ms                | Prisma metrics      |
| Redis memory usage              | > 80% of plan limit    | Upstash/Redis Cloud |
| Socket.io connected clients     | > 8,000 per server     | Custom metric       |
| API response time p95           | > 2s                   | Vercel/Railway      |
| Scoring queue depth             | > 1,000 pending        | Redis LLEN          |
| Error rate (5xx)                | > 1%                   | Logging service     |

---

## Summary

The path from ~500 to 50,000 concurrent users requires work across **4 layers**: database (indexes + pooling + denormalization), application (batch scoring + caching), real-time (Redis adapter + horizontal socket scaling), and infrastructure (multi-instance deployment + monitoring). Phase 1 alone (4 hours of work) gets the platform to ~5,000 users. The full plan takes approximately 6-8 weeks of engineering effort.
