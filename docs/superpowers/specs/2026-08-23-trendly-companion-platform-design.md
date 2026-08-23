# Trendly — Companion Workforce Platform Design

**Date:** 2026-08-23
**Status:** Approved design (pending implementation plan)
**Supersedes:** "TrendForge" naming and dark/gold design system references

---

## 1 · Vision

Everyone uses AI, but nobody has ever *seen* theirs. Trendly is the first
platform where you customize your AI companion — give it a face, a style, an
identity you **own** — and then put it to work earning money through trending,
executable wealth-tasks.

**The loop:**

1. **Forge** your companion (look, personality, skills)
2. Pick a trending money-task
3. Choose your involvement: **DIY** · **Co-pilot** · **Autopilot**
4. Your companion executes the task's steps adaptively — whatever the task
   requires, the AI does it and makes it easy
5. You receive an email → review → **one-click finalize → get paid**

The human clicks one button. The AI does the rest.

**Ownership:** companions and cosmetics are the user's property — ownable
web4 assets, not rented skins. The goal is portability: what you forge here
goes with you everywhere.

## 2 · Brand

- The product is **Trendly**. All "TrendForge" strings are placeholder residue
  and get purged (UI copy, metadata, emails, seeds, docs).
- Visual identity is the existing live one: near-black navy (`#06060E`),
  neon-cyan primary (`#00F0FF`), gold as secondary accent, Orbitron display /
  mono UI font. Documentation is corrected to describe *this* reality.
- Header wordmark already reads TRENDLY; no logo work needed.

## 3 · Information Architecture

### 3.1 Navigation (signed-in)

| Group | Items |
|---|---|
| Dashboard | `/dashboard` |
| **Earn ▾** | Weekly Tasks `/tasks` · Trends Radar `/trends` · Success Stories `/stories` |
| **My Companion ▾** | The Forge `/avatar-studio` · Approval Inbox *(S2)* · Activity Feed *(S4)* |
| **The World** | `/arena` — full-3D explorable space; cosmetics showcase & fun |
| **Build ▾** | Agent Studio `/builder` · My Agents `/agents` · Workflows `/workflows` |
| Community | `/community` |
| **Market ▾** | Marketplace `/marketplace` · Referrals `/referrals` · Pricing `/pricing` |

Battles/combat is demoted off-nav (systems stay in code and API).

Anonymous nav: Earn ▾ (preview), Arena, Marketplace, Pricing + Sign In /
Launch Free. Mobile mirrors desktop groups as accordions.
Profile stays in the right-side user cluster; Sign Out unchanged.

### 3.2 Demotions (functional, not removed)

| Route | Treatment |
|---|---|
| `/dev/stage3d` | Off-nav, `noindex` meta |
| `/status`, `/legal`, `/compliance`, `/enterprise` | Footer links only |
| `/admin/brain`, `/admin/health`, swarm admin | Single Admin ▾ menu (admins only) |

No routes move. No redirects required.

## 4 · Task Execution Engine (the money loop, S2)

Per-task mode selection: `DIY | CO_PILOT | AUTOPILOT`.

**Autopilot = approve-to-finalize.** The companion reads the task's structured
`steps` and executes them adaptively — research, drafting, prep — whatever the
task requires. Any step that sends something to an external party (an
application, an email, a listing) pauses at a **gate**: the user approves with
one click before it goes out. Fully-automated outbound actions on third-party
platforms are a non-goal (account-ban risk to users); everything else runs
hands-off.

### 4.1 Data model (additive, Prisma)

```
enum ExecutionMode   { DIY CO_PILOT AUTOPILOT }
enum SubmissionState { DRAFTING STEP_EXECUTING PENDING_APPROVAL APPROVED_SENT
                       DELIVERED PAID FAILED }

model TaskSubmission {
  id             String          @id @default(cuid())
  userTaskId     String          @unique
  userTask       UserTask        @relation(fields:[userTaskId], references:[id])
  mode           ExecutionMode
  state          SubmissionState @default(DRAFTING)
  currentStep    Int?            // index into Task.steps being executed
  stepResults    Json?           // per-step execution log (companion's work)
  pendingAction  Json?           // queued external action awaiting approval
  targetPlatform String?         // wherever THIS task leads (upwork, etsy,
                                 // direct client, ...) — task-defined, not fixed
  deliverable    String?
  paidAmount     Float?
  companionId    String?         // free-form until S4 adds the avatar↔agent
                                 // relation; tracks which companion did the work
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}
```

Emails fire at each gate (existing Abacus notification pattern):
steps executed → approval needed → sent confirmation → payment reminder.

### 4.2 Mode behaviors

| Mode | Companion does | Human does |
|---|---|---|
| DIY | Advisory tips only | Everything |
| Co-pilot | Executes steps on request, drafts sections | Guides, approves each send |
| Autopilot | Executes all steps adaptively; queues external actions at gates | One click per approval gate; finalize for payment |

## 5 · The World (3D playground)

`/arena` is reimagined: combat goes out, **self-expression comes in**. A
GTA-style explorable 3D space where users walk their customized companion
around, show off owned cosmetics, and have fun. No battles, no scores — the
city is a stage for identity.

- Built on the existing `three`/R3F stack and procedural GLB pipeline.
- Equipped cosmetics render on the avatar in-world (already proven by the
  Stage3D work).
- Battles systems remain in code/API but are demoted off-nav.

## 6 · Ownership & portability (web4)

Companions and cosmetics are the user's **property**, not rentals:

- Cosmetics purchases/ownership continue through the existing web4 marketplace.
- Each owned asset gets an export bundle (GLB + metadata JSON) so what users
  forge can leave Trendly with them — portability is a first-class promise,
  not an afterthought.
- The Forge is framed as *minting your companion's identity*, not customizing
  a profile picture.

## 7 · Roadmap (each phase ships independently)

| Phase | Scope | Depends on |
|---|---|---|
| **S1 — Skeleton** | Nav IA + demotions + Trendly brand sweep + landing/dashboard retell (companion-first) | nothing |
| **S2 — Money loop** | Execution modes, TaskSubmission model + step-executor, Approval Inbox page, gate emails | S1 |
| **S3 — The World** | 3D playground replacing arena combat; cosmetics in-world showcase | S1 (Stage3D exists) |
| **S4 — Companion identity** | Avatar↔agent binding during tasks; Activity Feed ("your companion researched 12 clients…"); cosmetics as task rewards; export bundles v1 | S2 |
| Later | Deeper ownership/portability standards, multi-companion workforces | out of scope here |

## 8 · Non-goals (explicit)

- Fully-automated outbound actions on third-party platforms (ban risk).
- Route renames/moves in S1–S2.
- Payment processing changes — earnings arrive externally; Trendly tracks,
  celebrates, and proves them.
- Removing existing features (demote ≠ delete).

## 9 · Safety & verification per phase

- `tsc --noEmit` + Vitest suite green before every commit.
- Post-deploy probe of changed surfaces (nav render, footer, admin menu auth).
- S2 adds unit tests for submission state-machine transitions before any real
  Autopilot usage.
- Schema additions are additive-only; `prisma db push` against shared Supabase
  with dev-server stopped (Windows DLL lock), matching established procedure.
