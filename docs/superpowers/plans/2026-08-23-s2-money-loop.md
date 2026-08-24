# S2 Implementation Plan — The Money Loop

Spec: `docs/superpowers/specs/2026-08-23-trendly-companion-platform-design.md`
Goal: pick a task → choose DIY / Co-pilot / Autopilot → companion executes the
task's structured steps adaptively → external actions pause at approval gates
→ one-click approve → get paid.

## Ground truth this plan builds on
- `UserTask` exists (`@@unique([userId, taskId])`, `status` enum,
  `stepsCompleted`) → execution state extends it additively.
- `lib/email.ts` exposes one generic `sendNotificationEmail(...)` → gate
  emails reuse it (grace-degrades to console without SENDGRID key).
- `lib/web4/skills-library.ts`: declarative skills with `category:
  SCRAPER|FINANCE|OUTREACH|MEDIA|CODE|SOCIAL|UTILITY` and `computeCostUsdc`
  → engine maps step actions onto skill categories.
- Task generation lives in `lib/pipeline.ts` + `lib/agents/reddit-scraper.ts`
  → structured-step emission lands there.
- LLM access: reuse whatever client `lib/agents/*` scripts already call.

## Honest v1 semantics (pinned by tests before any real Autopilot)
- Gate actions NEVER auto-execute. Approving an external action surfaces the
  ready-to-send payload + target-platform deep link and marks `APPROVED_SENT`
  only after the user confirms ("Mark as sent" / platform ping-back later).
- Non-external steps run hands-off in Autopilot (research/draft/generate/
  analyze via LLM).
- `DELIVERED` / `PAID` remain user-reported (existing earnings flow) until a
  later phase integrates platforms.
- Concurrency: one running execution per UserTask, guarded in-process
  (`status == STEP_EXECUTING` short-circuit). No new queue infra.

## Tasks

### T1 — Schema additions (additive only)
`UserTask` += `mode String?`, `currentStep Int?`, `stepResults Json?`,
`companionId String?`. New model:

    model Approval {
      id          String    @id @default(cuid())
      userId      String
      user        User      @relation(fields:[userId], references:[id])
      userTaskId  String
      userTask    UserTask  @relation(fields:[userTaskId], references:[id])
      stepIndex   Int
      action      Json
      status      String    @default("PENDING") // PENDING|APPROVED|REJECTED
      reviewedAt  DateTime?
      createdAt   DateTime  @default(now())
      @@index([userId])  @@index([status])
    }

Procedure: stop dev server (DLL lock) → `prisma db push` → restart.
Verify: tsc + tests green; kill-switch drill still passes.

### T2 — Structured steps + backcompat parser
New `lib/tasks/steps.ts`:
- `TaskStep` type per spec (`action`, `external`, `tools`, `estimatedTime`,
  `outputType`).
- `parseSteps(raw): ParsedStep[]` — legacy string[] → advisory entries
  (`action:"analyze", external:false, source:"legacy"`).
Unit tests: legacy strings, mixed arrays, malformed JSON.

### T3 — Pipeline emits structured steps
`lib/pipeline.ts` (+ scraper prompt): generation output must produce
structured steps going forward; keep confidence/risk stages untouched.
Re-seed demo tasks with mixed legacy+structured examples for dev visibility.
Verify: newly generated tasks parse via T2 util.

### T4 — Execution engine core
New `lib/execution/engine.ts` + `lib/execution/skills.ts`:
- `startExecution(userId, taskId, mode)` → upsert UserTask, dispatch runner
  unless already `STEP_EXECUTING`.
- Step loop: resolve skill category by `action`; execute via LLM-backed
  handlers (`research|draft|generate|analyze` = hands-off; `send|deploy|
  trade` = create Approval row, set `PENDING_APPROVAL`, email, halt loop).
- Append every step result to `stepResults`; advance `currentStep`.
- Modes: DIY → no-op (advisory copy); CO_PILOT → executes single requested
  step on demand; AUTOPILOT → full loop, halting at gates.
- Resume: approving/rejecting an Approval resumes an AUTOPILOT run.
Verify: unit tests with stubbed LLM handlers (no network).

### T5 — Gate emails
On Approval creation: `sendNotificationEmail` "Nova is ready to send —
approve or edit" with inbox deep link `/approvals`. On resume: confirmation
email. Verify: console degradation path asserted in tests.

### T6 — API routes
- `POST /api/tasks/execute` `{ taskId, mode, stepIndex? }` (session auth;
  CO_PILOT takes optional stepIndex)
- `GET  /api/tasks/status?taskId=` → UserTask + stepResults + pendingApproval
- `GET  /api/approvals/list` · `POST /api/approvals/approve` ·
  `POST /api/approvals/reject` (session auth, ownership checks)
All routes `force-dynamic`. Verify: auth returns 401 unauthenticated;
ownership enforced (404 not 403 for foreign resources).

### T7 — State-machine tests (SAFETY GATE)
`tests/execution-engine.test.ts`: legal transitions, illegal transitions
rejected, gate never auto-executes, resume-on-approval, concurrency
short-circuit, mode differences. **Autopilot stays disabled in production
until this suite is green** — enforced by a feature check reading an env
flag (`AUTOPILOT_ENABLED=1`) set only after review.

### T8 — `/approvals` page + nav activation
Server page → `_components/approvals-client.tsx`: pending cards (task title,
companion name, step, payload preview, [Approve] [Edit] [Reject]), history
section below. Add "Approval Inbox" item to My Companion ▾ group in header.
Verify: renders empty-state signed-in; foreign approvals invisible.

### T9 — Task detail mode selector + run view
`/tasks/[id]`: mode selector (DIY / Co-pilot / Autopilot) wired to execute
API; live status strip (current step, results log, pending-approval CTA).
Reuse existing task-detail page structure; no redesign.

## Ship checklist
tsc + Vitest green per commit → push → Vercel probes (`/tasks/[id]`,
`/approvals` 200 signed-in, execute API 401 anonymous) → set
`AUTOPILOT_ENABLED=1` in Vercel env only after T7 review → smoke-test one
real Co-pilot run end-to-end.
