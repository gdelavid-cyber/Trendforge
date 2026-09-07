# Track 2 Real Buyers Dedup Freshness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Buyers and tasks are live-only real people, never duplicated, stable list with NEW/LIVE badges plus issued dates.

**Architecture:** Remove hardcoded buyer pools, enforce fingerprint unique constraint, live scrape or pending with retry, stable ordering with new on top.

**Tech Stack:** Next.js 14, Prisma, Reddit/HN live fetch, Jaccard similarity >=0.45, vitest.

**Spec:** docs/superpowers/specs/2026-09-07-task-transparency-buyers-council-design.md (Section 2)

## Global Constraints

- Empty state wording is pending fresh intel — retry never blocked never fake.
- No hardcoded buyers, no phantom $150 budgets, empty pipeline shows $0 + pending.
- Income shown anywhere = ledger-backed real money only via userRealIncomeUsdc.
---

### Task 1: Remove hardcoded buyers, live-or-pending

**Files:**
- Modify: `nextjs_space/lib/earn/agents/buyer-hunter.ts`
- Modify: `nextjs_space/lib/money/sales/leads-scraper.ts`
- Modify: `nextjs_space/app/api/earn/leads/route.ts`
- Modify: `nextjs_space/lib/earn/agents/trend-scout.ts`
- Modify: `nextjs_space/app/api/earn/opportunities/route.ts`
- Test: `nextjs_space/tests/track2-no-fakes.test.ts`

**Interfaces:**
- Consumes: live scrape functions scrape_reddit_painpoints, scrape_hackernews_launches
- Produces: huntQualifiedBuyers() returns live[] or {status:'pending', retry:true}; never static 5

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
describe('track2 no fakes', () => {
  it('buyer hunter returns live or pending, never mike chen', async () => {
    const mod = await import('../lib/earn/agents/buyer-hunter');
    const out: any = await mod.huntQualifiedBuyers({} as any);
    const s = JSON.stringify(out);
    expect(s).not.toContain('mike@mikeshvacdallas.com');
    expect(s).not.toContain('Marcus Vance');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/track2-no-fakes.test.ts`
Expected: FAIL with contains mike chen until removed.

- [ ] **Step 3: Write minimal implementation**

```typescript
// buyer-hunter.ts: delete static roster, call real executor scrape_reddit_painpoints; on empty/blocked return { status:'pending', buyers: [], retry:true, message:'pending fresh intel — retry' }
// leads-scraper.ts: delete prospectGenerators templates; persistScrapedLeads only persists live leads with sourceUrl
// app/api/earn/leads/route.ts: remove static 5, proxy live or pending
// trend-scout.ts + opportunities/route.ts: remove defaultCurated, return [] + pending when DB empty
// remove ||15000 budget fallbacks, use 0 + pending
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/track2-no-fakes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/lib/earn/agents/buyer-hunter.ts nextjs_space/lib/money/sales/leads-scraper.ts nextjs_space/app/api/earn/leads/route.ts nextjs_space/lib/earn/agents/trend-scout.ts nextjs_space/app/api/earn/opportunities/route.ts
git commit -m "feat(track2): live-only buyers pending never fake"
```

### Task 2: Global fingerprint dedup + backfill

**Files:**
- Modify: `nextjs_space/prisma/schema.prisma`
- Modify: `nextjs_space/lib/pipeline/index.ts`
- Modify: `nextjs_space/app/api/cron/pipeline/route.ts`
- Modify: `nextjs_space/lib/swarm/revenue/memory.ts`
- Modify: `nextjs_space/app/api/council/approve-task/route.ts`
- Test: `nextjs_space/tests/track2-dedup.test.ts`

**Interfaces:**
- Consumes: calculateSimilarity(a,b), fingerprint(title)=lower.trim
- Produces: createTask/createTrend skips duplicate, returns {ok:false, reason:'duplicate'}

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { calculateSimilarity, isDuplicate } from '../lib/pipeline/index';
describe('track2 dedup', () => {
  it('flags near-duplicate titles', () => {
    expect(isDuplicate('AI voice agents for HVAC', ['ai voice agents for hvac!!'], 0.45)).toBe(true);
    expect(calculateSimilarity('a b c', 'a b c')).toBeGreaterThan(0.9);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/track2-dedup.test.ts`
Expected: FAIL until threshold enforced globally.

- [ ] **Step 3: Write minimal implementation**

```typescript
// schema.prisma: add fingerprint String? @unique to Trend and Task, migrate
// lib/pipeline/index.ts: export fingerprint(s)=s.toLowerCase().trim().replace(/[^a-z0-9 ]/g,'').slice(0,120)
// cron/pipeline/route.ts: before create, check findUnique fingerprint + isDuplicate vs recent 50, skip on hit
// memory.ts createTask: findFirst fingerprint then skip
// approve-task/route.ts: findFirst fingerprint then skip double-click
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/track2-dedup.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/prisma/schema.prisma nextjs_space/lib/pipeline/index.ts nextjs_space/app/api/cron/pipeline/route.ts nextjs_space/lib/swarm/revenue/memory.ts
git commit -m "feat(track2): global fingerprint dedup"
```

### Task 3: Stable list NEW/LIVE + issued date age

**Files:**
- Modify: `nextjs_space/app/tasks/_components/infinite-task-list.tsx`
- Modify: `nextjs_space/components/tasks/task-card.tsx`
- Modify: `nextjs_space/app/api/tasks/stream/route.ts`
- Test: `nextjs_space/tests/track2-freshness.test.ts`

**Interfaces:**
- Consumes: Task {id, title, createdAt, fingerprint, isLive}
- Produces: list sorted live-new first then stable, card shows issued date + age + NEW/LIVE badge

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
describe('track2 freshness', () => {
  it('stream returns createdAt for age display', async () => {
    const mod = await import('../app/api/tasks/stream/route');
    expect(typeof mod.GET).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/track2-freshness.test.ts`
Expected: FAIL until createdAt + badge present.

- [ ] **Step 3: Write minimal implementation**

```typescript
// stream/route.ts: select id,title,createdAt; orderBy [{isFeatured:'desc'},{createdAt:'desc'}]
// infinite-task-list.tsx: dedupe by id client-side, new ids prepend with NEW badge if createdAt < 24h, LIVE if trendScore>=80
// task-card.tsx: show `Issued ${new Date(createdAt).toLocaleDateString()} · ${ageH}h ago` + badge, remove optimistic vote inflation
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/track2-freshness.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/app/tasks/_components/infinite-task-list.tsx nextjs_space/components/tasks/task-card.tsx nextjs_space/app/api/tasks/stream/route.ts
git commit -m "feat(track2): stable list with NEW LIVE badges and issued dates"
```
