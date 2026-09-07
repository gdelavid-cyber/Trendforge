# Track 3 Council Brain Sellflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Council debates with real LLM transparently, single main brain dispatches, brainstorm-to-sell flows in order.

**Architecture:** Replace templated council with LLM calls emitting to ExecutionLog, single dispatcher owns START/KILL, drawer shows brainstorm to sale steps.

**Tech Stack:** Next.js 14, LLM via makeLlm platform chain, Prisma CouncilSession ExecutionLog, vitest.

**Spec:** docs/superpowers/specs/2026-09-07-task-transparency-buyers-council-design.md (Section 3)

## Global Constraints

- Council visible to user read-only, approve stays admin.
- No SIMULATED SUCCESS, unmapped skills return pending never SUCCESS.
- No invented margins, cost/margin logged with every decision.
---

### Task 1: Real LLM council emitting transparently

**Files:**
- Modify: `nextjs_space/lib/council/council-runner.ts`
- Modify: `nextjs_space/lib/council/signal-harvester.ts`
- Modify: `nextjs_space/app/api/council/debate/route.ts`
- Test: `nextjs_space/tests/track3-council.test.ts`

**Interfaces:**
- Consumes: makeLlm() from lib/execution/llm.ts, harvestNextCouncilSignal()
- Produces: runCouncilDebate(signal) returns {turns, scores, verdict} with each turn logged via emitProgress

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
describe('track3 council real llm', () => {
  it('runner exports debate fn', async () => {
    const mod = await import('../lib/council/council-runner');
    expect(typeof (mod as any).runCouncilDebate ?? typeof (mod as any).default).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/track3-council.test.ts`
Expected: FAIL until real LLM wired (templated scores still present).

- [ ] **Step 3: Write minimal implementation**

```typescript
// council-runner.ts: for each of 6 personas, call makeLlm() with persona prompt + signal, collect text, score via validateHighProfitabilityCriteria, emitProgress per turn, final verdict via emitDone
// signal-harvester.ts: fix 8 vs 12 archetypes, recentTitles from last 30 sessions, no Math.random fallback when exhausted — return pending
// debate/route.ts: export const dynamic='force-dynamic', POST harvests then runs debate then returns turns
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/track3-council.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/lib/council/council-runner.ts nextjs_space/lib/council/signal-harvester.ts nextjs_space/app/api/council/debate/route.ts
git commit -m "feat(track3): real LLM council transparent"
```

### Task 2: Single brain dispatcher, kill double loops

**Files:**
- Modify: `nextjs_space/lib/swarm/revenue/masterBrain.ts`
- Modify: `nextjs_space/lib/swarm/revenue/coordinator.ts`
- Modify: `nextjs_space/lib/swarm/controller.ts`
- Modify: `nextjs_space/lib/intelligence/tools/executor.ts`
- Test: `nextjs_space/tests/track3-brain.test.ts`

**Interfaces:**
- Consumes: BrainDecision {action: START_TASK|KILL_AGENT, reasons, margin}
- Produces: executePulse creates at most 1 task, unmapped skills return {status:'pending'}

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
describe('track3 single brain', () => {
  it('executor never returns simulated success', async () => {
    const mod = await import('../lib/intelligence/tools/executor');
    const out: any = await (mod as any).executeSkill?.('unknown_skill_xyz', {});
    if (out) expect(out.status).not.toBe('SUCCESS');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/track3-brain.test.ts`
Expected: FAIL with SIMULATED SUCCESS until fixed.

- [ ] **Step 3: Write minimal implementation**

```typescript
// executor.ts: unmapped skill returns { status:'pending', simulated:false, message:'pending fresh intel — retry' }
// masterBrain.ts: single START_TASK per pulse, margin>=0.40 preflight logged
// coordinator.ts: remove seed-if-empty double-create, guard activeTasks.length===0 only when no decision created one
// controller.ts: add pulse lock (redis or in-memory) so revenue/coordinator and AssetJob loops never double-advance
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/track3-brain.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/lib/swarm/revenue/masterBrain.ts nextjs_space/lib/swarm/revenue/coordinator.ts nextjs_space/lib/swarm/controller.ts nextjs_space/lib/intelligence/tools/executor.ts
git commit -m "feat(track3): single brain dispatcher no sim success"
```

### Task 3: Brainstorm-to-sell in drawer order

**Files:**
- Modify: `nextjs_space/components/earn/brainstorm-modal.tsx`
- Modify: `nextjs_space/components/execution/SalesPipelineCard.tsx`
- Modify: `nextjs_space/app/tasks/[id]/_components/task-detail-client.tsx`
- Test: `nextjs_space/tests/track3-sellflow.test.ts`

**Interfaces:**
- Consumes: POST /api/tasks/[id]/brainstorm, /execute-swarm, /leads, /sales-kit, /sales
- Produces: drawer steps brainstorm>plan>dispatch>milestones>leads>kit>sale each pending/done

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
describe('track3 sellflow', () => {
  it('sales pipeline card exists without phantom 150', async () => {
    const src = await import('fs').then(m => m.readFileSync('components/execution/SalesPipelineCard.tsx', 'utf8').catch(() => ''));
    expect(src).not.toContain('||15000');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/track3-sellflow.test.ts`
Expected: FAIL until ||15000 removed.

- [ ] **Step 3: Write minimal implementation**

```typescript
// brainstorm-modal.tsx: remove hardcoded marketVector fallback, on fail show pending + retry
// SalesPipelineCard.tsx: replace ||15000 with 0 + pending label, BOT_SELLS/YOU_SELL/HYBRID selector writes sales-option API
// task-detail-client.tsx: render steps in order with pending/done from ExecutionLog, no modal hopping
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/track3-sellflow.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nextjs_space/components/earn/brainstorm-modal.tsx nextjs_space/components/execution/SalesPipelineCard.tsx nextjs_space/app/tasks/[id]/_components/task-detail-client.tsx
git commit -m "feat(track3): brainstorm to sell in drawer order"
```
