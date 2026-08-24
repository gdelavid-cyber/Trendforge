# S4 Implementation Plan — Companion Identity & Portability

Spec §6 + roadmap S4. Goal: the companion stops being scattered state and
becomes ONE owned entity — forged once, visible everywhere, exportable.

## Ground truth
- Identity today is split: client-side avatar config (studio defaults),
  Web4Agent rows, chat persona strings ('Nova' hardcoded in engine context).
- Engine already accepts `companionId` on `startExecution` and stores it on
  UserTask — nothing populates it yet.
- No persistence for studio loadouts (in-memory only) — noted; full config
  persistence lands here via Companion.config.
- Existing earnings claim flow: `completePowerMoveAction` in `app/actions.ts`.

## Tasks

### T1 — Schema: `Companion` model
Per spec §4: name, config Json, personality Json, memory Json?, skills
String[], level, totalEarnings, tasksCompleted, rarity. Additive push
(dev-server restart dance).

### T2 — Provisioning + APIs
`lib/companion/service.ts`: `getOrCreatePrimary(userId)` — lazy-forge on
first touch (name = first web4Agent's name ?? 'Nova'; default config;
personality bio seeded friendly/analytical).
Routes:
- `GET /api/companion` → companion + derived stats
- `PATCH /api/companion` → rename / personality bio / config merge (auth)
Tests: idempotent provisioning, rename persists.

### T3 — Engine binding
`startExecution` resolves `opts.companionId ?? primary companion id`; stores
on UserTask; engine buildContext uses companion name (no more hardcoded
'Nova'). On run COMPLETED: increment companion.tasksCompleted + xp→level rule
(level = floor(tasksCompleted / 5) + 1).
Test tweak: engine suite asserts companionId stamped.

### T4 — Activity feed
`GET /api/companion/activity` → latest N events across user's UserTasks by
flattening stepResults + gate events, shaped as `{at, verb, text, taskId}`.
Dashboard: add Activity card (top 6 lines, companion-named phrasing).
Tests: flattening/order/limit.

### T5 — `.trendly` export v1
`GET /api/companion/export` → JSON attachment (`.trendly.json`, version '1.0')
with companion, personality, skills, owned cosmetics list (UserCosmetic join),
memory stub, metadata. Binary ZIP deferred (documented in plan deviation).
Button: "Export .trendly" on dashboard companion banner.
Test: shape + ownership.

### T6 — Dashboard companion card
Upgrade existing debrief banner area with name/level/rarity/earnings/
tasksCompleted chips sourced from `/api/companion`.

## Deviations logged inline if scope shifts.

## Ship checklist
tsc + Vitest green per commit → push → Vercel probes: `/api/companion` 401
anon, dashboard renders signed-in, export downloads signed-in.
