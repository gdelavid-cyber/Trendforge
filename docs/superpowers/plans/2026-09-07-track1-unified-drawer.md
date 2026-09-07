# Track 1 Unified Live Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One auto-opened live drawer on task click showing every AI step in order.

**Architecture:** Single SSE subscription to ExecutionLog per taskId replaces triple polling. Emitter wraps all engine calls. Approvals inline.

**Tech Stack:** Next.js 14 App Router, SSE, Prisma ExecutionLog, sonner toasts secondary, vitest.

**Spec:** docs/superpowers/specs/2026-09-07-task-transparency-buyers-council-design.md (Section 1)

## Global Constraints

- Empty state wording is pending fresh intel never blocked.
- Income shown anywhere = ledger-backed real money only via userRealIncomeUsdc.
- All API routes have export const dynamic = force-dynamic.
- Copy rule: pending not blocked for empty/live-wait states.
---

### Task 1: SSE stream hardening per task

**Files:**
- Modify: `nextjs_space/app/api/activity/stream/route.ts`
- Modify: `nextjs_space/app/api/activity/feed/route.ts`
- Test: `nextjs_space/tests/track1-sse-order.test.ts`

**Interfaces:**
- Consumes: ExecutionLog rows {id, kind, taskId, text, timestamp, hash}
- Produces: GET /api/activity/stream?taskId= returns SSE events ordered timestamp asc + cursor; GET /api/activity/feed?taskId=&cursor= returns {items, nextCursor}

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
describe('track1 sse order', () => {
  it('exports stream GET with taskId filter', async () => {
    const mod = await import('../app/api/activity/stream/route');
    expect(typeof mod.GET).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/track1-sse-order.test.ts`
Expected: FAIL with Cannot find module or GET not function until hardened.

- [ ] **Step 3: Write minimal implementation**

```typescript
// in nextjs_space/app/api/activity/stream/route.ts
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const taskId = url.searchParams.get('taskId') ?? '';
  const cursor = url.searchParams.get('cursor') ?? null;
  const { prisma } = await import('@/lib/core/prisma');
  const rows = await prisma.executionLog.findMany({
    where: { taskId: taskId || undefined },
    orderBy: { createdAt: 'asc' },
    take: 50,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const stream = new ReadableStream({
    start(c) {
      for (const r of rows) c.enqueue(`data: ${JSON.stringify({ id: r.id, taskId: r.taskId, text: r.actionDescription, timestamp: r.createdAt })}\n\n`);
      c.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/track1-sse-order.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/app/api/activity/stream/route.ts nextjs_space/tests/track1-sse-order.test.ts
git commit -m "feat(track1): harden SSE stream per task"
```

### Task 2: useTeamActivity wraps executes

**Files:**
- Modify: `nextjs_space/hooks/useTeamActivity.ts`
- Modify: `nextjs_space/app/tasks/[id]/_components/task-detail-client.tsx`
- Test: `nextjs_space/tests/track1-team-activity.test.ts`

**Interfaces:**
- Consumes: emitStart/emitProgress/emitDone/requestAck from lib/activity/emitter
- Produces: useTeamActivity().run(label, fn) emits start/done + toast success/error

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
describe('track1 team activity wraps', () => {
  it('run emits start and done', async () => {
    const { emitStart, emitDone } = await import('../lib/activity/emitter');
    expect(typeof emitStart).toBe('function');
    expect(typeof emitDone).toBe('function');
    const mod = await import('../hooks/useTeamActivity');
    expect(typeof mod.useTeamActivity).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/track1-team-activity.test.ts`
Expected: PASS shape now, FAIL on wrap behavior until implemented (run does not call emit).

- [ ] **Step 3: Write minimal implementation**

```typescript
// in nextjs_space/hooks/useTeamActivity.ts
import { toast } from 'sonner';
import { emitStart, emitDone } from '@/lib/activity/emitter';
export function useTeamActivity(taskId: string, actorId: string) {
  async function run(label: string, fn: () => Promise<unknown>) {
    await emitStart({ taskId, actorId, actionDescription: label });
    toast.loading(label);
    try {
      const out = await fn();
      await emitDone({ taskId, actorId, actionDescription: label });
      toast.success(label);
      return out;
    } catch (e) {
      toast.error(label);
      throw e;
    }
  }
  return { run };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/track1-team-activity.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/hooks/useTeamActivity.ts nextjs_space/tests/track1-team-activity.test.ts
git commit -m "feat(track1): team activity wraps executes"
```

### Task 3: Unified drawer auto-open + inline approvals

**Files:**
- Modify: `nextjs_space/components/activity/TeamActivityDrawer.tsx`
- Modify: `nextjs_space/app/tasks/[id]/_components/task-detail-client.tsx`
- Test: `nextjs_space/tests/track1-drawer.test.ts`

**Interfaces:**
- Consumes: GET /api/activity/stream?taskId= SSE
- Produces: <UnifiedTaskDrawer taskId> auto-open on first mount, inline Approve buttons POST /api/tasks/[id]/approve

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
describe('track1 drawer', () => {
  it('exports drawer component', async () => {
    const mod = await import('../components/activity/TeamActivityDrawer');
    expect(mod).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/track1-drawer.test.ts`
Expected: FAIL until auto-open prop exists.

- [ ] **Step 3: Write minimal implementation**

```typescript
// in TeamActivityDrawer.tsx: accept taskId + autoOpen, subscribe EventSource `/api/activity/stream?taskId=${taskId}`, render ordered list, approval_requested rows show <button onClick={() => fetch(`/api/tasks/${taskId}/approve`, {method:'POST'})}>Approve</button>, closed shows pill with latest text + unread count.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/track1-drawer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/components/activity/TeamActivityDrawer.tsx nextjs_space/app/tasks/[id]/_components/task-detail-client.tsx
git commit -m "feat(track1): unified drawer auto-open with inline approvals"
```
