# Trendly — The Companion Economy · Canonical Design

**Date:** 2026-08-23 · **Status:** Approved direction, phased implementation
**Source:** owner vision doc ("Trendly — The Companion Economy") merged with codebase reality audit.

> "The user clicks one button. The companion does everything. The user owns everything."

---

## 1 · Core loop

1. **Forge** a companion — base model, look, personality
2. **Pick** a trending task (radar refreshed by the ingestion engine)
3. **One click** — companion executes the task's steps adaptively; pauses only
   at approval gates (external/costly actions)
4. **Get paid** — review, approve, finalize. The companion did the work.

## 2 · Reality map — vision vs shipped code

| Subsystem | Status | Notes |
|---|---|---|
| Ingestion engine (scrape→dedupe→validate→generate) | **SHIPS** | 7-stage LLM pipeline, reddit-scraper, cron routes exist. Add: 15-min cadence tuning, restore Jaccard dedupe (fast-dedup.ts was deleted), structured-step generation |
| Tasks w/ steps | **PARTIAL** | `Task.steps` is free-text strings today → upgrade to structured `TaskStep[]` (`action`, `external`, `tools`, `outputType`); old tasks stay valid as advisory DIY steps |
| Execution modes + AutopilotEngine | **NEW** | `lib/execution/` orchestrator; skills-library.ts is the foundation |
| Approval gates + inbox | **NEW** | `Approval` model + `/approvals` page + gate emails (Abacus pattern) |
| Companion entity | **PARTIAL** | Identity split between client-side `AvatarConfigState`, Web4Agent rows, chat persona → unify into `Companion` model (config, personality, memory, skills, level, earnings) |
| Cosmetics economy | **SHIPS** | Cosmetic/UserCosmetic/CosmeticTransaction + web4 marketplace + swarm asset factory. Slots today: HEAD/BODY/AURA/TRAIL/FINISHER |
| Studio depth | **PARTIAL** | avatar-studio renders live 3D, presets, GLB exporter; add eyewear/voice/animation categories, body sliders, skin patterns, 2 new archetypes (animal, abstract) |
| The World (3D playground) | **PARTIAL** | /arena exists with Stage3D combat framing → pivot to exploration/showcase |
| Ownership/export (.trendly bundle) | **PARTIAL** | 3D spec JSON exporter exists → extend to ZIP(GLB + config/personality/memory/skills JSON), documented open format |
| TREND currency | **DECISION** | Propose rebranding existing `favorCredits` as TREND rather than a parallel currency |

## 3 · Information architecture

Signed-in nav:

| Group | Items |
|---|---|
| Dashboard | `/dashboard` — companion hero card, quick actions, live radar, activity feed |
| **Earn ▾** | Weekly Tasks `/tasks` · Trends Radar `/trends` · Success Stories `/stories` |
| **My Companion ▾** | The Forge `/avatar-studio` · Approval Inbox `/approvals` *(S2)* · Activity Feed *(S4)* |
| **The World** | `/arena` — 3D playground, cosmetics showcase (combat demoted off-nav) |
| **Build ▾** | Agent Studio `/builder` · My Agents `/agents` · Workflows `/workflows` |
| Community | `/community` |
| **Market ▾** | Marketplace `/marketplace` · Referrals `/referrals` · Pricing `/pricing` |

Demotions: `/dev/stage3d` off-nav + noindex; `/status` `/legal` `/compliance`
`/enterprise` footer-only; admin buttons → single Admin ▾ menu. No route moves.
Brand sweep: purge all TrendForge strings; docs describe the real cyan identity.

## 4 · Data model changes (all additive)

```
model Companion {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields:[userId], references:[id])
  name          String
  config        Json     // CompanionConfig (baseModel, body, skin, slots…)
  personality   Json     // traits[] + bio
  memory        Json?    // conversations + learned patterns
  skills        String[]
  level         Int      @default(1)
  totalEarnings Float    @default(0)
  tasksCompleted Int     @default(0)
  rarity        String   @default("common")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Approval {
  id          String    @id @default(cuid())
  userId      String
  userTaskId  String
  userTask    UserTask  @relation(fields:[userTaskId], references:[id])
  stepIndex   Int
  action      Json      // queued external action payload
  status      String    @default("PENDING") // PENDING|APPROVED|REJECTED
  reviewedAt  DateTime?
  createdAt   DateTime  @default(now())
}

// UserTask gains additive columns:
//   mode String?           (DIY | CO_PILOT | AUTOPILOT)
//   currentStep Int?
//   stepResults Json?
//   companionId String?
// (Approval rows are the source of truth for gated actions.)
```

Structured step shape on Task.steps (JSON):

```
{ id, title, description,
  action: research|draft|generate|send|deploy|trade|scrape|analyze,
  external: boolean, tools: string[], estimatedTime, outputType }
```

Legacy string-steps parse into advisory entries with `action:"analyze",
external:false` — nothing breaks.

## 5 · Execution engine (S2 core)

- `lib/execution/engine.ts`: understand task → execute steps via skills →
  log results → adapt plan → finalize. Mirrors the owner's AutopilotEngine
  pseudocode.
- Gates: any `step.external === true` or money-costing step creates an
  `Approval` row, flips UserTask → PENDING_APPROVAL, emails the user.
  Approve (inbox/email one-click) resumes execution; reject skips the step
  and logs why.
- Modes: DIY (advisory), Co-pilot (step-on-request), Autopilot (full run).
- Every step result appends to Activity Feed (S4 surfaces it).

## 6 · Roadmap

| Phase | Ships | Key risk control |
|---|---|---|
| **S1 Skeleton** | Nav IA + brand sweep + landing/dashboard retell | pure UI, no API/schema |
| **S2 Money loop** | Structured steps (pipeline + parser), UserTask columns, Approval model + inbox + gate emails, engine v1 (Co-pilot first, then Autopilot), /approvals page | state-machine unit tests before any real Autopilot |
| **S3 The World** | Arena pivot to 3D playground; equipped cosmetics render in-world | Stage3D already proven |
| **S4 Companion identity** | `Companion` model + migration from scattered identity, Activity Feed, level/earnings stats, `.trendly` export bundle v1 | additive migration, dry-run import/export roundtrip tests |
| **S5 Studio depth** | Eyewear/voice/animation categories, body sliders, skin patterns, animal + abstract archetypes, TREND rebrand of favorCredits | catalog-driven, swarm pipeline generates assets |
| Later | Companion licensing/trading, multi-companion workforces, portability standard v2 | |

## 7 · Non-goals

- Fully-automated outbound third-party actions (ban risk to users).
- Route renames/moves through S4.
- Payment processing changes — Trendly tracks and proves earnings.
- Deleting features (demote ≠ delete).

## 8 · Verification per phase

`tsc --noEmit` + Vitest green per commit · post-deploy route probes · S2
state-machine tests gate Autopilot enablement · additive-only schema pushes
via established procedure (dev server stopped for Windows DLL lock).
