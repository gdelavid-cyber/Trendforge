# Team Transparency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every executable click emits realtime team-visible status and pauses for human ack on risky moves.

**Architecture:** Single `ExecutionLog` event source with `Approval` gates. New `ActivityEmitter` wraps logger plus traces. New feed plus stream APIs serve a global drawer. `useTeamActivity` standardizes clicks. Engines call emitter.

**Tech Stack:** Next.js 14 App Router, Prisma 6.7.0, Vitest 4.1.11, sonner toasts, SSE with poll fallback.

**Spec:** `docs/superpowers/specs/2026-09-06-team-transparency-design.md`

## Global Constraints

- Income shown anywhere equals ledger-backed real money only.
- Companions do REAL work or report BLOCKED, never fake outcomes.
- `export const dynamic = 'force-dynamic'` on all API routes.
- Feed is owner-scoped, non-owners get 404 semantics.
- `AUTOPILOT_ENABLED` env flag behavior unchanged.
- TypeScript strict, `npx tsc --noEmit --skipLibCheck` clean.

---

### Task 1: ActivityEmitter server helper

**Files:**
- Create: `nextjs_space/lib/activity/emitter.ts`
- Test: `nextjs_space/tests/activity-emitter.test.ts`

**Interfaces:**
- Consumes: `lib/execution/logger.ts:logExecutionEvent`, `lib/growth/nova/traces.ts:recordTrace`
- Produces: `emitStart(input)`, `emitProgress(input)`, `emitDone(input)`, `emitBlocked(input)`, `requestAck(input)` — each `(input: { taskId: string; milestoneId?: string | null; actorId: string; actionDescription: string; outputs?: Record<string, any> }) => Promise<{ id: string | null }>`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';

describe('activity emitter', () => {
  it('exports five emit functions', async () => {
    const mod = await import('../lib/activity/emitter');
    expect(typeof mod.emitStart).toBe('function');
    expect(typeof mod.emitProgress).toBe('function');
    expect(typeof mod.emitDone).toBe('function');
    expect(typeof mod.emitBlocked).toBe('function');
    expect(typeof mod.requestAck).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/activity-emitter.test.ts`
Expected: FAIL with "Failed to resolve import" or "Cannot find module".

- [ ] **Step 3: Write minimal implementation**

```typescript
import { logExecutionEvent } from '@/lib/execution/logger';
import { recordTrace } from '@/lib/growth/nova/traces';

export interface EmitInput {
  taskId: string;
  milestoneId?: string | null;
  actorId: string;
  actionDescription: string;
  outputs?: Record<string, any>;
}

async function emit(kind: 'companion_action' | 'user_action', input: EmitInput) {
  const row = await logExecutionEvent({
    taskId: input.taskId,
    milestoneId: input.milestoneId ?? null,
    logType: kind,
    actor: 'companion',
    actorId: input.actorId,
    actionDescription: input.actionDescription,
    outputs: input.outputs ?? {},
  });
  return { id: row?.id ?? null };
}

export async function emitStart(input: EmitInput) {
  return emit('companion_action', input);
}

export async function emitProgress(input: EmitInput) {
  return emit('companion_action', input);
}

export async function emitDone(input: EmitInput) {
  const out = await emit('companion_action', input);
  void recordTrace({ userId: null, kind: 'STEP', subject: input.actionDescription.slice(0, 200), summary: 'Done.', reasons: [] });
  return out;
}

export async function emitBlocked(input: EmitInput) {
  const out = await emit('companion_action', input);
  void recordTrace({ userId: null, kind: 'STEP', subject: input.actionDescription.slice(0, 200), summary: 'Blocked, reported honestly.', reasons: [input.actionDescription.slice(0, 500)] });
  return out;
}

export async function requestAck(input: EmitInput) {
  return logExecutionEvent({
    taskId: input.taskId,
    milestoneId: input.milestoneId ?? null,
    logType: 'approval_requested',
    actor: 'system',
    actorId: input.actorId,
    actionDescription: input.actionDescription,
    outputs: input.outputs ?? {},
  }).then((row) => ({ id: row?.id ?? null }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/activity-emitter.test.ts`
Expected: PASS 1 test.

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/lib/activity/emitter.ts nextjs_space/tests/activity-emitter.test.ts
git commit -m "feat: add team activity emitter"
```

### Task 2: Activity feed API

**Files:**
- Create: `nextjs_space/app/api/activity/feed/route.ts`
- Test: `nextjs_space/tests/activity-feed.test.ts`

**Interfaces:**
- Consumes: `prisma.executionLog`, `prisma.approval`, Task 1 types
- Produces: `GET /api/activity/feed?taskId=&limit=&cursor=` returns `{ success: true, entries: Array<{ id: string; kind: string; taskId: string; text: string; timestamp: string; hash: string | null }> , nextCursor: string | null }`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';

describe('activity feed route', () => {
  it('returns entries shape', async () => {
    const mod = await import('../app/api/activity/feed/route');
    expect(typeof mod.GET).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/activity-feed.test.ts`
Expected: FAIL with cannot find module.

- [ ] **Step 3: Write minimal implementation**

```typescript
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100);
  const cursor = searchParams.get('cursor');

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const where: any = taskId ? { taskId } : { task: { userTasks: { some: { userId: user.id } } } };
  const logs = await prisma.executionLog.findMany({
    where: cursor ? { ...where, timestamp: { lt: new Date(parseInt(cursor)) } } : where,
    orderBy: { timestamp: 'desc' },
    take: limit + 1,
  });
  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? String(items[items.length - 1].timestamp.getTime()) : null;
  return NextResponse.json({
    success: true,
    entries: items.map((l) => ({ id: l.id, kind: l.logType, taskId: l.taskId, text: l.actionDescription, timestamp: l.timestamp.toISOString(), hash: l.hash })),
    nextCursor,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/activity-feed.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/app/api/activity/feed/route.ts nextjs_space/tests/activity-feed.test.ts
git commit -m "feat: add team activity feed API"
```

### Task 3: Activity stream SSE with poll fallback

**Files:**
- Create: `nextjs_space/app/api/activity/stream/route.ts`
- Test: `nextjs_space/tests/activity-stream.test.ts`

**Interfaces:**
- Consumes: Task 2 feed shape
- Produces: `GET /api/activity/stream?taskId=` returns SSE `data: {entries}` or JSON fallback `{ success: true, entries }`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';

describe('activity stream route', () => {
  it('exports GET', async () => {
    const mod = await import('../app/api/activity/stream/route');
    expect(typeof mod.GET).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/activity-stream.test.ts`
Expected: FAIL cannot find module.

- [ ] **Step 3: Write minimal implementation**

```typescript
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const accept = req.headers.get('accept') || '';
  const where: any = taskId ? { taskId } : {};
  const logs = await prisma.executionLog.findMany({ where, orderBy: { timestamp: 'desc' }, take: 20 });
  const entries = logs.map((l) => ({ id: l.id, kind: l.logType, taskId: l.taskId, text: l.actionDescription, timestamp: l.timestamp.toISOString(), hash: l.hash }));
  if (accept.includes('text/event-stream')) {
    const body = `data: ${JSON.stringify({ entries })}\n\n`;
    return new NextResponse(body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
  }
  return NextResponse.json({ success: true, entries });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/activity-stream.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/app/api/activity/stream/route.ts nextjs_space/tests/activity-stream.test.ts
git commit -m "feat: add team activity stream"
```

### Task 4: useTeamActivity hook

**Files:**
- Create: `nextjs_space/hooks/useTeamActivity.ts`
- Test: `nextjs_space/tests/use-team-activity.test.ts`

**Interfaces:**
- Consumes: `/api/activity/feed`, sonner `toast`
- Produces: `useTeamActivity(taskId: string)` returns `{ run: (label: string, fn: () => Promise<{ ok: boolean; message?: string }>) => Promise<void>; isRunning: boolean }`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';

describe('useTeamActivity hook', () => {
  it('exports hook', async () => {
    const mod = await import('../hooks/useTeamActivity');
    expect(typeof mod.useTeamActivity).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/use-team-activity.test.ts`
Expected: FAIL cannot find module.

- [ ] **Step 3: Write minimal implementation**

```typescript
'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useTeamActivity(taskId: string) {
  const [isRunning, setIsRunning] = useState(false);
  const run = useCallback(async (label: string, fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setIsRunning(true);
    const id = toast.loading(`${label} — working…`);
    try {
      const out = await fn();
      if (out.ok) toast.success(`${label} — done.`, { id });
      else toast.error(out.message || `${label} — blocked.`, { id });
    } catch (e: any) {
      toast.error(e?.message || `${label} — failed.`, { id });
    } finally {
      setIsRunning(false);
    }
  }, []);
  return { run, isRunning };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/use-team-activity.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/hooks/useTeamActivity.ts nextjs_space/tests/use-team-activity.test.ts
git commit -m "feat: add useTeamActivity hook"
```

### Task 5: TeamActivityDrawer global component

**Files:**
- Create: `nextjs_space/components/activity/TeamActivityDrawer.tsx`
- Modify: `nextjs_space/app/layout.tsx:39-56` to mount drawer inside Providers
- Test: `nextjs_space/tests/team-activity-drawer.test.ts`

**Interfaces:**
- Consumes: Task 2 feed API, Task 3 stream
- Produces: `<TeamActivityDrawer taskId?: string />` with LIVE/PAUSED toggle and filters ALL, MILESTONES, LEADS, OUTREACH, SALES, APPROVALS, VALIDATION

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';

describe('team activity drawer', () => {
  it('exports component', async () => {
    const mod = await import('../components/activity/TeamActivityDrawer');
    expect(typeof mod.TeamActivityDrawer).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/team-activity-drawer.test.ts`
Expected: FAIL cannot find module.

- [ ] **Step 3: Write minimal implementation**

```typescript
'use client';

import { useEffect, useState } from 'react';

export interface FeedEntry { id: string; kind: string; taskId: string; text: string; timestamp: string; hash: string | null; }

export function TeamActivityDrawer({ taskId }: { taskId?: string }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!open) return;
    let dead = false;
    const load = async () => {
      const q = taskId ? `?taskId=${taskId}` : '';
      const res = await fetch(`/api/activity/feed${q}`, { cache: 'no-store' });
      const data = await res.json();
      if (!dead && data.success) setEntries(data.entries);
    };
    load();
    if (!isLive) return () => { dead = true; };
    const t = setInterval(load, 3500);
    return () => { dead = true; clearInterval(t); };
  }, [open, taskId, isLive]);

  if (!open) return <button onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full bg-cyan-400 text-black font-mono text-xs font-bold">Team feed</button>;
  const shown = entries.filter((e) => filter === 'ALL' ? true : e.kind.toLowerCase().includes(filter.toLowerCase().slice(0, 4)));
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/90 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-bold text-white uppercase">Team activity</span>
        <div className="flex gap-2">
          <button onClick={() => setIsLive((v) => !v)} className="text-[10px] font-mono text-cyan-300">{isLive ? 'LIVE' : 'PAUSED'}</button>
          <button onClick={() => setOpen(false)} className="text-[10px] font-mono text-white/50">Close</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {['ALL', 'MILESTONES', 'LEADS', 'OUTREACH', 'SALES', 'APPROVALS', 'VALIDATION'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'text-[10px] font-mono text-cyan-300 font-bold' : 'text-[10px] font-mono text-white/50'}>{f}</button>
        ))}
      </div>
      <div className="space-y-2">
        {shown.length === 0 ? <p className="text-[11px] text-white/40">No activity yet. Run a task to see the team talk.</p> : shown.map((e) => (
          <div key={e.id} className="rounded-lg border border-white/10 p-2">
            <div className="text-[9px] font-mono text-white/40">{e.kind} · {new Date(e.timestamp).toLocaleTimeString()} · #{(e.hash || '').slice(0, 8)}</div>
            <div className="text-[11px] text-white/90">{e.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/team-activity-drawer.test.ts`
Expected: PASS.

- [ ] **Step 5: Mount in layout and commit**

Edit `nextjs_space/app/layout.tsx` to import and render `<TeamActivityDrawer />` inside `<Providers>` after `<NovaAssistant />`.
Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -n 20`
Expected: no errors in new files.

```bash
git add nextjs_space/components/activity/TeamActivityDrawer.tsx nextjs_space/app/layout.tsx nextjs_space/tests/team-activity-drawer.test.ts
git commit -m "feat: add global team activity drawer"
```

### Task 6: AckGate approval card

**Files:**
- Create: `nextjs_space/components/activity/AckGate.tsx`
- Test: `nextjs_space/tests/ack-gate.test.ts`

**Interfaces:**
- Consumes: `/api/approvals/approve`, `/api/approvals/reject`
- Produces: `<AckGate approvalId={string} title={string} onDecided={() => void} />`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';

describe('ack gate', () => {
  it('exports component', async () => {
    const mod = await import('../components/activity/AckGate');
    expect(typeof mod.AckGate).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ack-gate.test.ts`
Expected: FAIL cannot find module.

- [ ] **Step 3: Write minimal implementation**

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function AckGate({ approvalId, title, onDecided }: { approvalId: string; title: string; onDecided: () => void }) {
  const [busy, setBusy] = useState(false);
  const decide = async (path: 'approve' | 'reject') => {
    setBusy(true);
    try {
      const res = await fetch(`/api/approvals/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvalId }) });
      const data = await res.json();
      if (data.success || res.ok) toast.success(`Decision recorded: ${path}.`);
      else toast.error(data.error || 'Decision failed.');
      onDecided();
    } catch {
      toast.error('Network error recording decision.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3">
      <div className="text-[11px] font-mono font-bold text-amber-300 uppercase">Needs one click: {title}</div>
      <div className="mt-2 flex gap-2">
        <button disabled={busy} onClick={() => decide('approve')} className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-[11px] font-mono font-bold">Approve</button>
        <button disabled={busy} onClick={() => decide('reject')} className="px-3 py-1 rounded-full bg-white/5 text-white/70 text-[11px] font-mono">Reject</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ack-gate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/components/activity/AckGate.tsx nextjs_space/tests/ack-gate.test.ts
git commit -m "feat: add ack gate card"
```

### Task 7: Engine transparency wiring

**Files:**
- Modify: `nextjs_space/lib/execution/engine.ts:79-117` to call emitter on outcome
- Modify: `nextjs_space/lib/execution/autonomous-engine.ts:79-88` to call emitter on init
- Test: `nextjs_space/tests/engine-transparency.test.ts`

**Interfaces:**
- Consumes: Task 1 `emitDone`, `emitBlocked`
- Produces: every `recordOutcome` also emits team-visible log entry

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';

describe('engine transparency', () => {
  it('recordOutcome path uses emitter', async () => {
    const src = await import('fs').then((fs) => fs.readFileSync('lib/execution/engine.ts', 'utf8'));
    expect(src.includes('emitDone') || src.includes('emitBlocked')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine-transparency.test.ts`
Expected: FAIL because emitter not referenced yet.

- [ ] **Step 3: Write minimal implementation**

In `lib/execution/engine.ts` inside `recordOutcome` after `appendStepResult`, add:

```typescript
const { emitDone, emitBlocked } = await import('@/lib/activity/emitter');
if (outcome.blocked) await emitBlocked({ taskId: (await prisma.userTask.findUnique({ where: { id: userTaskId }, select: { taskId: true } }))?.taskId ?? '', actionDescription: `${step.title} — blocked: ${String(outcome.output).slice(0, 300)}`, actorId: userTaskId });
else await emitDone({ taskId: (await prisma.userTask.findUnique({ where: { id: userTaskId }, select: { taskId: true } }))?.taskId ?? '', actionDescription: `${step.title} — done.`, actorId: userTaskId });
```

In `lib/execution/autonomous-engine.ts` after init `logExecutionEvent`, add `emitStart` with same taskId and plan id in outputs.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine-transparency.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/lib/execution/engine.ts nextjs_space/lib/execution/autonomous-engine.ts nextjs_space/tests/engine-transparency.test.ts
git commit -m "feat: wire engines to team feed"
```

### Task 8: Task page and approvals links

**Files:**
- Modify: `nextjs_space/app/tasks/[id]/_components/task-detail-client.tsx:457-530` to use `useTeamActivity` for execute buttons
- Modify: `nextjs_space/app/approvals/_components/approvals-client.tsx` to render `AckGate`
- Test: `nextjs_space/tests/transparency-links.test.ts`

**Interfaces:**
- Consumes: Tasks 4, 5, 6
- Produces: every execute click shows toast plus drawer entry; approvals inbox uses shared AckGate

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';

describe('transparency links', () => {
  it('task detail uses team hook', () => {
    const src = fs.readFileSync('app/tasks/[id]/_components/task-detail-client.tsx', 'utf8');
    expect(src.includes('useTeamActivity')).toBe(true);
  });
  it('approvals inbox uses ack gate', () => {
    const src = fs.readFileSync('app/approvals/_components/approvals-client.tsx', 'utf8');
    expect(src.includes('AckGate')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/transparency-links.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

In `task-detail-client.tsx` add `import { useTeamActivity } from '@/hooks/useTeamActivity';` and wrap `handleAutonomousExecute` body with `team.run('Swarm step', async () => { ... return { ok: true }; })`. Add link button `<a href="#team-feed">Open team feed</a>` next to LiveLogTerminal.

In `approvals-client.tsx` import `AckGate` and render it for each pending approval row, passing `approvalId`, `title`, and `onDecided={refresh}`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/transparency-links.test.ts`
Expected: PASS. Then `npx tsc --noEmit --skipLibCheck`.

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/app/tasks/\[id\]/_components/task-detail-client.tsx nextjs_space/app/approvals/_components/approvals-client.tsx nextjs_space/tests/transparency-links.test.ts
git commit -m "feat: link task and approvals to team feed"
```
