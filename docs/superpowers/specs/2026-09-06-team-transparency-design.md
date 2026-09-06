# Team Transparency — Realtime + Ack Gates Design

Date: 2026-09-06
Status: Proposed — awaiting human review before implementation plan
Scope: All executables (tasks, moves, swarm, agents, Nova, earn, companion, council)
Choices locked: live status + approval gates, global drawer + in-place links, realtime SSE with poll fallback

## 1. Problem

Executing a task or move shows no tracking. Two engines diverge:
- Companion modes (`/api/tasks/execute` → `lib/execution/engine.ts`) write `UserTask.stepResults` + `TaskArtifact`, shown in `RunFeed`.
- Autonomous swarm (`/api/tasks/[id]/execute` → `lib/execution/autonomous-engine.ts`) writes `ExecutionPlan` + `Artifact` + `ExecutionLog`, shown in timeline/vault/terminal.

`LiveLogTerminal` fetched `/api/tasks/[id]/logs` which did not exist (added 2026-09-06). Autonomous `advanceExecutionPlan` recursed through all milestones in one POST (fixed to single-step 2026-09-06). No shared team feed, no consistent human-in-loop gates.

## 2. Goal

Any click that executes work shows what is happening so the human stays in the loop. Team rule: every execution talks back. Success means:
- Every executable emits start, progress, terminal state to one visible feed.
- Risky actions pause for human Approve/Reject and log the decision.
- Drawer is reachable from anywhere; task pages link into it.
- No silent completion, no silent failure.

## 3. Architecture

Single team activity stream. `ExecutionLog` is the source of truth (SHA-256 hash-chained via `prevHash`). `Approval` is the gate table. `UserTask.stepResults` and Nova `traces` merge into the same read model.

New read path:
- `GET /api/activity/feed?taskId?&limit&cursor` merges ExecutionLog + Approvals + recent stepResults, owner-scoped (404 semantics like `runs/[id]`).
- `GET /api/activity/stream` SSE with 3.5s poll fallback (same interval as `LiveLogTerminal` today).

Write path:
- `ActivityEmitter` server helper (`emitStart`, `emitProgress`, `emitDone`, `emitBlocked`) wraps `logExecutionEvent` and `recordTrace` so engines cannot diverge.
- Risky branches (external action, money movement, live deploy) call `queueApproval`, set status `PENDING_APPROVAL` or `WAITING_USER_CHOICE`, and stop. Human decision resumes or skips.

## 4. Components

- `lib/activity/emitter.ts`: `emitStart`, `emitProgress`, `emitDone`, `emitBlocked`, `requestAck`. Thin wrapper over `lib/execution/logger.ts` and `lib/growth/nova/traces.ts`. Fire-and-forget for traces, awaited for logs.
- `hooks/useTeamActivity.ts`: click wrapper. Optimistic drawer entry + toast, POST, refresh feed, terminal toast. Used by every execute button.
- `components/activity/TeamActivityDrawer.tsx`: global slide-over. Header bell toggles it. Filters ALL, MILESTONES, LEADS, OUTREACH, SALES, APPROVALS, VALIDATION. LIVE/PAUSED toggle pauses polling. Hash badge per entry (`#hash.slice(0,8)`), timestamp, actor, type, description, artifact links.
- `components/activity/AckGate.tsx`: Approve/Reject card with optional reason. Used in drawer, `/approvals` inbox, and inline where execution paused. Writes `approval_decision` log.
- Engine touchpoints: `lib/execution/engine.ts` (runSingleStep, runAutopilot, approveGate, rejectGate), `lib/execution/autonomous-engine.ts` (all 7 milestone cases), `lib/agents/orchestrator.ts`, `lib/swarm/*` (pulse, trigger, spawn, survival), `app/api/nova/actions/*`, `app/api/earn/plan/route.ts`, `app/api/council/*`. Each calls emitter; risky branches call `requestAck`.

## 5. Data Flow

Standard execution:
1. Click → hook inserts optimistic `user_action` entry, toast "Working…".
2. POST single-step endpoint (autonomous pattern: one milestone per POST).
3. Server writes `milestone_start`, does work, writes `milestone_complete` or `artifact_created`, updates `currentMilestone` and `progress`, returns `{status, currentMilestone, actionTaken}`.
4. Client refreshes drawer, timeline, vault, RunFeed after every step. Loops max 10 steps until `COMPLETED`, `WAITING_USER_CHOICE`, `PENDING_APPROVAL`, `PAUSED`, or `FAILED`.

Gate flow:
1. Engine hits risky step → writes `approval_requested`, creates `Approval PENDING`, returns `PENDING_APPROVAL`.
2. Drawer, approvals inbox, and inline card show AckGate. Toast "Needs one click" with link.
3. Human Approves → `approval_decision` log, engine runs that step, resumes loop. Rejects → `rejected_by_user` log, step skipped, loop continues from next index.

Feed flow:
1. `GET /api/activity/feed` returns newest 50 merged entries with `nextCursor`.
2. SSE pushes new entries. On disconnect client falls back to 3.5s poll.
3. Task pages keep existing feeds (RunFeed, LiveLogTerminal, timeline) and add "Open team feed" link that opens drawer filtered to that `taskId`.

## 6. Error Handling

- Short single-step POSTs avoid timeouts. Retry of a `COMPLETED` milestone advances pointer without duplicate artifacts (idempotent guard shipped 2026-09-06).
- Failed step writes `failed` log plus `recordTrace` reason. Feed shows red card with output snippet. Toast links to feed. Autopilot skips and continues; swarm loop stops with error toast.
- SSE disconnect falls back to poll. Optimistic entries reconcile by real `id` and `hash` on next fetch.
- `PAUSED` stops all loops. Resume re-enters from `currentMilestone`.
- Feed is owner-scoped. Non-owners receive 404 semantics matching `app/api/tasks/runs/[id]/route.ts`.

## 7. Testing

- Unit: emitter hash chain links (`prevHash`), pause guard blocks advance, idempotent retry skips `COMPLETED`, gate creates `PENDING` and blocks.
- Route: feed merges logs and approvals scoped to owner; unauthenticated returns 401; unknown task returns 404; logs route still serves task-scoped entries.
- Client: hook transitions optimistic to done, AckGate approve resumes one step, reject skips, LIVE/PAUSED toggles polling.
- Regression: `tests/tasks-steps.test.ts` (12 tests) and `tests/council-hot-task.test.ts` must stay green. Manual: swarm run 1-4, sales choice, 5-7, co-pilot step, approval gate — drawer, terminal, timeline stay in sync.

## 8. Out of Scope

- No new money movement logic. No change to ledger rules (real-money only).
- No change to Autopilot env flag (`AUTOPILOT_ENABLED`).
- No push notifications or email beyond existing approval email. No mobile-specific UI.
- No rewrite of existing RunFeed or LiveLogTerminal beyond linking into drawer.

## 9. Files Touched (planned, not yet implemented)

- New: `lib/activity/emitter.ts`, `hooks/useTeamActivity.ts`, `components/activity/TeamActivityDrawer.tsx`, `components/activity/AckGate.tsx`, `app/api/activity/feed/route.ts`, `app/api/activity/stream/route.ts`.
- Edit: `lib/execution/engine.ts`, `lib/execution/autonomous-engine.ts`, `lib/agents/orchestrator.ts`, `lib/swarm/*` call sites, `app/api/nova/actions/*`, `app/api/earn/plan/route.ts`, `app/api/council/*`, `app/tasks/[id]/_components/task-detail-client.tsx`, `components/execution/LiveLogTerminal.tsx`, `app/approvals/_components/approvals-client.tsx`, global layout for drawer mount.
