# Task Transparency + Real Buyers + Council/Brain — Design
Date: 2026-09-07
Status: approved in chat (3/3 sections yes), pending file review

## Goal
As soon as he clicks a task, full transparency of how the AI is working on it, always notifying what's going on. No mocks in buyers scraped — real people only. No duplicated tasks / same thing — constantly fresh. AI council + main brain working right with follow-up. Dashboard task flow works in order from brainstorming to time-to-sell / sales force. Money-ready.

## Split (3 ways)
1. Task-click transparency
2. Real buyers + no dupes + freshness with dates
3. Council + main brain transparent + brainstorm-to-sell

## Section 1 — Task-click transparency (approved)
- On `/tasks/[id]`, single unified live drawer auto-opens on first click.
- One SSE stream from `ExecutionLog` ordered by timestamp + hash chain. Replaces 3x 3.5s pollers (`run-feed`, `LiveLogTerminal`, `TeamActivityDrawer`).
- Kinds: started / milestone / lead / outreach / sale / approval-needed / done / pending.
- Approvals render inline with approve button, no page hop to `/approvals`.
- `useTeamActivity.run()` actually wraps executes so every AI step emits start/progress/done.
- Closed state: live pill with latest step + unread count. Toasts are secondary, never sole signal.
- Files touched: `app/tasks/[id]/_components/task-detail-client.tsx`, `components/activity/TeamActivityDrawer.tsx`, `components/execution/LiveLogTerminal.tsx`, `app/tasks/[id]/_components/run-feed.tsx`, `hooks/useTeamActivity.ts`, `app/api/activity/feed/route.ts`, `app/api/activity/stream/route.ts`, `lib/activity/emitter.ts`.

## Section 2 — Real buyers + no dupes + freshness (approved)
- Delete hardcoded sources: `lib/earn/agents/buyer-hunter.ts` (5 same people), `lib/money/sales/leads-scraper.ts` prospect templates, `app/api/earn/leads/route.ts` static list, `lib/earn/agents/trend-scout.ts` 3 static opps, `app/api/earn/opportunities/route.ts` defaultCurated, `lib/pipeline` procedural fallback when no key, `lib/swarm/revenue/memory.ts` fake seed trends.
- All buyers/tasks must be live Reddit/HN scrape (`lib/agents/reddit-scraper.ts`, `lib/pipeline`, `lib/intelligence/tools/executor.ts` real skills) or DB rows derived from live scrape.
- Empty state wording: "pending fresh intel — retry". Never "blocked", never fake buyers.
- Global dedup: normalized-title fingerprint + Jaccard >= 0.45, DB unique constraint on fingerprint, `findFirst` pre-check before create. Fixes per-run-only Set in `app/api/cron/pipeline/route.ts`, unconditional `swarmTask.create` in `lib/swarm/revenue/memory.ts`, double-create in `coordinator.ts`, re-approval dup in `app/api/council/approve-task/route.ts`.
- One offline backfill using `scripts/ops/deduplicate-database.ts` extended to fuzzy match.
- `/tasks` list stable order, new live items push to top with NEW/LIVE badge. Every card shows issued date + age (issued Sep 7, 2h ago).
- Remove $150 phantom defaults (`SalesPipelineCard`, `leads-scraper`, `sales/route.ts`). Empty pipeline shows $0 + pending.
- Files touched: above + `app/tasks/_components/*`, `components/tasks/task-card.tsx`, `app/api/tasks/stream/route.ts`, `app/api/cron/pipeline/route.ts`, `prisma/schema.prisma`.

## Section 3 — Council + main brain transparent + brainstorm-to-sell (approved)
- No cartoon visuals. Same transparency treatment as tasks.
- `lib/council/council-runner.ts`: replace templated turns / fixed scores with real LLM debate. Every persona turn + score + verdict emits to `ExecutionLog`.
- Council visible to user, not admin-only. `components/council/council-boardroom.tsx` admin gate removed for read view; approve stays admin.
- Single main brain dispatcher: council advises, brain decides START/KILL/dispatch with why + cost/margin check logged. Reconcile 3 overlapping brains (companion `lib/intelligence/companion/brain.ts`, nova `lib/growth/nova/brain.ts`, revenue `lib/swarm/revenue/masterBrain.ts` + second controller `lib/swarm/controller.ts`) — brain is boss, others are tools.
- Dashboard flow in same drawer, no modal hopping: brainstorm → plan → swarm dispatch → milestones → leads → sales kit → log sale, each with pending/done state.
- No simulated skill yields (`executor.ts` `[SIMULATED]` must return pending, never SUCCESS), no invented margins.
- Files touched: `lib/council/*`, `app/api/council/*`, `lib/swarm/revenue/*`, `lib/intelligence/companion/brain.ts`, `lib/growth/nova/*`, `components/earn/brainstorm-modal.tsx`, `components/execution/SalesPipelineCard.tsx`, `app/tasks/[id]/sales/*`, `app/tasks/[id]/sales-kit/*`.

## Data flow
Task click → open drawer → subscribe SSE (`/api/activity/stream?taskId=`) → emits from engine/council/brain via `emitStart/Progress/Done/requestAck` → inline approvals → milestones advance → leads persist (deduped) → sales kit generate → log sale → ledger (`userRealIncomeUsdc` only income source).

## Error handling
Live scrape fail → pending + retry, never synthetic. LLM unparseable → pending, never `success:true` with generics. Concurrent pulse → unique-constraint wins, loser skips + logs. Stripe placeholder → pending, never fake escrow.

## Testing
- Drawer: SSE ordering test, approval inline test, unread pill test.
- Buyers: no-hardcoded-buyers test (assert live source or pending), dedup test (same title twice → one row), freshness test (issued date + age renders, NEW on top).
- Council/brain: real-LLM debate emits turns test, single-dispatcher test (no double task create per pulse), no-simulated-success test.

## Out of scope
3D/cartoon visuals, push notifications/email beyond existing approval email, new scraping infra, currency/ledger changes.
