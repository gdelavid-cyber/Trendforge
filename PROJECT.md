# Trendly — Autonomous Wealth Platform

Trendly is an autonomous wealth intelligence platform in one repository, but it is best understood as two systems with a shared "autonomous swarm + observability" layer:

- **Web platform** — [`nextjs_space/`](nextjs_space/) — the hosted Next.js product: landing, dashboard, agents, community, monetization, observability APIs, council/gatekeeper behavior, and the visual companion layer.
- **Desktop harness** — [`starnet/`](starnet/) (package name `trendly-os`) — a local-first desktop/sidecar harness that is the visual command center and agent runtime for Trendly autonomous swarms.

Live production web URL: <https://trendly-platform-chi.vercel.app>

---

## How to read this document

The structure is intentional:

1. **Project identity** — names, IDs, and the two-system split.
2. **Three concern layers** — the conceptual separation used everywhere below.
3. **Web platform** — what lives in `nextjs_space/` and how the app is organized.
4. **Autonomous swarm behavior + observability** — the shared "autonomous" layer, where it lives, and how its pieces fit together.
5. **Desktop harness** — what `starnet/` is, what it is not, and how its runtime is organized.
6. **How the pieces relate** — the integration story and where responsibilities deliberately stop.
7. **Key entry points and scripts** — the practical starting points for each system.
8. **Suggested next documentation steps** — concrete follow-ups if you want to go deeper.

---

## Project identity

- Project id: `db845fb6-cdcb-4e2f-abc3-e938abae7898`
- Web app: `nextjs_space`
- Desktop harness: `starnet`, distributed as `trendly-os`
- Web stack: Next.js 14, Prisma, PostgreSQL, NextAuth, Stripe, Redis, S3, Three.js / React Three Fiber, Radix UI, Framer Motion, Lucide, sonner, Vitest
- Desktop stack: Tauri v2 desktop shell, Node.js sidecar runtime, MCP/acp servers, local persistence, provider keys in OS keychain

---

## Three concern layers

The repo is easiest to navigate if you separate it into three layers, even though they overlap in `nextjs_space/`:

1. **Web platform** — what users and admins touch in the browser.
2. **Autonomous swarm behavior + observability** — how agent work is generated, guarded, routed, executed, logged, and calibrated. This is woven through `nextjs_space/` and is also the category of work the desktop harness exists to run locally.
3. **Desktop harness** — the local command center and agent runtime that runs real work on real models and tools, separate from the hosted web platform.

The important nuance: the web platform **hosts and observes** autonomous behavior. The desktop harness is a separate runtime that can execute comparable autonomous work under local control. They share concepts, but they are not the same process and not the same deployment.

---

## 1. Web platform — `nextjs_space/`

The web platform is the hosted product surface.

### What it provides

- **User platform fundamentals** — auth, profiles, tasks, templates, votes, mentorship, referrals, community, notifications, weekly digests, and the companion/visual layer.
- **Agent and swarm surface** — swarms are represented and controlled from the web side, with quota, workflow, and execution plumbing backing them.
- **Companion / visual AI layer** — 3D avatar studio, real-time voice, lip-sync, and a conversational agent brain exposed through `/api/agent/chat`.
- **Observability as a product feature** — decision logging, outcome backfilling, calibration, and export APIs are part of the web app, not only internal ops.
- **Monetization and ops** — Stripe billing, referrals/commissions, email delivery, storage, and the rest of the hosted platform concerns.

### App surface

The web app is an Next.js App Router app. The major user-facing areas include:

- Landing and marketing pages
- Dashboard
- Tasks / earn flow
- Trends
- Agents, including Web4 agent surfaces
- Avatar studio
- Community, stories, referrals, quests
- Admin areas for brain, council, health, swarms, compliance, withdrawals
- Council and hot-trends surfaces
- Web4 swarm command center and analytics

### API surface

The API tree is large. The most architecturally important clusters are:

- **Council** — debate and approve-task endpoints
- **Observability** — calibration, health, and export
- **Swarm** — the autonomous revenue swarm control plane
- **Execution** — task execution, approvals, and gate handling
- **Ventures** — venture OS signals, approvals, and portfolio logic
- **Cron** — scheduled observability and pipeline/survival hooks
- **Station / starnet** — harness-adjacent or bridge endpoints where present

### Web subsystems that carry swarm and observability concerns

#### Council / gatekeeper debate

- `app/api/council/debate/route.ts`
- `lib/council/council-runner.ts`
- `lib/council/council-memory.ts`
- `lib/council/signal-harvester.ts`
- `lib/council/config.ts`
- `lib/council/admin-notify.ts`
- `lib/council/approve-feedback.ts`
- `lib/council/orchestration/venture-hierarchy.ts`

This is the multi-persona money council. The debate endpoint is admin-gated and runs a live six-persona debate with a gatekeeper verdict, derived conclusion, and council learning. The six personas are:

- `deal_finder`
- `trend_hunter`
- `unit_economist`
- `operator`
- `contrarian`
- `closer`

There is also a `COUNCIL_USER_MODE_ENABLED` toggle. When user-mode exposure is off, council discoveries stay quarantined internally; when it is on, approved sessions can be published to the hot trends feed.

#### Observability layer

- `lib/observability/collector.ts`
- `lib/observability/metrics.ts`
- `lib/observability/outcome.ts`
- `lib/observability/ecosystem.ts`
- `app/api/observability/calibration/route.ts`
- `app/api/observability/health/route.ts`
- `app/api/observability/export/route.ts`
- `worker/observability.ts`

This is the decision telemetry and calibration layer.

The main ideas:

- Every consequential gate call is instrumented through `instrumentedJevCall` and written to `DecisionLog`.
- Gate types include `trade_execution`, `lead_qualification`, `approval`, `completion`, `ledger_verification`, `tool_routing`, and `model_routing`.
- Outcomes are correlated later with real results through `recordOutcome`, `backfillTradeOutcomes`, and `backfillLeadOutcomes`.
- Calibration is computed across confidence buckets, snapshotted, and used for auto-tuning.
- The health endpoint reports `totalDecisions`, `totalOutcomes`, `calibrationCoveragePct`, `avgCalibrationError`, `lastRun`, and `dynamicGateConfigs`.
- Authorization in calibration and export uses an `isAuthorized` helper that is open in development and otherwise checks Bearer or `x-api-key` against `OBSERVABILITY_API_KEY`, `CRON_SECRET`, or `NEXTAUTH_SECRET`.
- The worker can run a single cycle with `--once` or loop hourly.

#### Venture OS layer

- `lib/council/orchestration/venture-hierarchy.ts`
- `lib/venture/engine.ts`
- `lib/autonomy/control-plane.ts`
- `lib/capital/allocation.ts`
- `lib/opportunity/intelligence.ts`
- `lib/intelligence/decision/mission-gate.ts`

The venture OS is a deterministic multi-agent operating layer. Its core question is "what should happen next?" It includes:

- A CEO recommendation loop over venture lifecycle state
- Autonomy control plane with human approval gates
- Capital allocation with spend authorization and reinvestment
- Opportunity intelligence with demand validation
- Mission gating that delegates to the swarm auto-guards

### Data model

Prisma in `nextjs_space/prisma/schema.prisma` covers the whole web-side domain. The major areas include:

- People and social: `User`, `CommunityPost`, `CommunityComment`, `Notification`, `WeeklyDigest`, `Referral`, `SuccessStory`, `Favor`, `Vote`, `Mentorship`
- Product workflows: `Trend`, `Task`, `UserTask`, `Template`, `Lead`, `LeadMessage`, `Sale`, `ExecutionLog`, `SalesKit`, `TaskBlueprint`, `ExecutionPlan`, `Milestone`, `Artifact`
- Agent and swarm surface: `BrainDecision`, `BrainMetric`, `AgentRun`, `AgentQuota`, `AgentWorkflow`, `AutonomousAgent`, `SwarmTask`, `AgentSpecies`, `AgentInstance`, `AssetJob`, `QAReview`, `SwarmControl`
- Money and ledger: `LedgerEntry`, `Deposit`, `Withdrawal`, `CosmeticTransaction`, and Stripe-adjacent billing/funding concerns
- Web4 and marketplace block: `Web4Agent`, `Cosmetic`, `UserCosmetic`, `MarketplaceListing`, `AgentBattle`, `AgentSurvivalLog`
- Councils and approvals: `CouncilSession`, `AdminNotification`, `AdminReview`, `HotTrendProposal`
- Observability: `DecisionLog`, `DecisionOutcome`, `CalibrationSnapshot`, `DynamicGateConfig`, `ObservabilityRun`
- Venture OS: `Venture`, `VentureOffer`, `HumanApprovalRequest`, `CapitalAllocationPlan`, `FinancialRecord`, `DemandValidationReport`, `MarketSignal`
- Swarm revenue: `SwarmBrainState`, `SwarmBrainDecision`, `SwarmTask`, `EvidenceBundle`, `Attestation`, `RevenueSummary`, `GoldenSample`, `BotConfig`, `StrategyUpdate`, `PerformancePattern`, `OutreachRecord`
- Operational plumbing: onboarding, grants, compliance, approvals, companions, keys/integrations, and the execution pipeline

---

## 2. Autonomous swarm behavior + observability — woven through `nextjs_space/`

This layer is the "autonomous" part of the platform. It is not one folder; it is a set of behaviors and contracts that show up across the web app.

### What this layer is responsible for

- Generating and running autonomous work: scraper blueprints, prediction/arbitrage payloads, video scripts, micro-SaaS scaffolding, and similar swarm jobs.
- Quota, budgeting, and spend constraints for agent work.
- Routing decisions through gates, including the council/gatekeeper debate path.
- Instrumenting every significant gate call with latency, cost, inputs, and actions.
- Correlating decisions with delayed real-world outcomes and computing calibration.
- Exposing that instrumentation for humans and downstream consumers.

### How it is expressed in the codebase

- **Decision instrumentation** is centralized in `lib/observability/collector.ts` through `instrumentedJevCall`.
- **Autonomous revenue swarm** lives in `lib/swarm/revenue/` and is exposed through `app/api/swarm/*`.
- **Forge asset swarm** lives in `lib/swarm/controller.ts`, `lib/swarm/gatekeeper.ts`, `lib/swarm/registry.ts`, `lib/swarm/queue.ts`, `lib/swarm/spend.ts`, and `lib/swarm/survival-engine.ts`.
- **Council debate** lives in `lib/council/`.
- **Observability metrics and outcome backfill** live in `lib/observability/`.
- **Background work** is available through `nextjs_space/` scripts such as `observability:worker` and `observability:verify`.

### Autonomous revenue swarm

This is the revenue-generating swarm runtime that lives in the web app.

Key pieces:

- **Coordinator** — `lib/swarm/revenue/coordinator.ts`
- **Master brain** — `lib/swarm/revenue/masterBrain.ts`
- **Memory / state** — `lib/swarm/revenue/memory.ts`
- **Templates** — `lib/swarm/revenue/templates.ts`
- **Attestation** — `lib/swarm/revenue/attestation.ts`
- **Escrow** — `lib/swarm/revenue/escrow.ts`
- **Agent roles** — `lib/swarm/revenue/agents/*`

The coordinator runs pulses that advance tasks through a multi-stage pipeline and keep the agent workforce reconciled. The master brain reasons over trends, budget, strategy, and survival mode, and produces brain decisions including `START_TASK`, `KILL_AGENT`, `ENTER_SURVIVAL`, and `EXIT_SURVIVAL`. The memory layer is the operational state spine for swarm tasks, agents, evidence bundles, attestations, revenue summaries, and strategy history.

The revenue swarm exposes a fairly complete control and telemetry API under `app/api/swarm/*`, including:

- `pulse`
- `start`
- `status`
- `config`
- `execute`
- `telemetry`
- `dry-run`
- `intel/brain/decisions`
- `intel/brain/strategy-history`
- `intel/learning/agent-perf`
- `intel/learning/patterns`
- `revenue/by-template`
- `revenue/timeseries`
- `revenue/export`
- `tasks/active`
- `tasks/trigger`
- `agents/spawn`
- `survival/toggle`
- `pause`
- `resume`

### Forge asset swarm

This is a separate swarm used for asset/cosmetic production work.

Key pieces:

- **Controller** — `lib/swarm/controller.ts`
- **Gatekeeper** — `lib/swarm/gatekeeper.ts`
- **Registry** — `lib/swarm/registry.ts`
- **Queue** — `lib/swarm/queue.ts`
- **Spend** — `lib/swarm/spend.ts`
- **Survival** — `lib/swarm/survival-engine.ts`
- **Species** — `lib/swarm/species/*`

The forge swarm runs species such as scout, designer, art worker, modeler, QA inspector, and publisher. It has per-species budgets, a global daily spend cap, a kill switch, and instance lifecycle management.

### Why this layer matters

The web platform hosts and observes autonomous behavior. That means the autonomy is real in the web app: decisions are logged, outcomes are correlated, calibration is computed, and council/gatekeeper debate can run.

The same conceptual layer is what the desktop harness is built to run in a local runtime.

---

## 3. Desktop harness — `starnet/` (`trendly-os`)

The desktop harness is the local command center and agent runtime for Trendly autonomous swarms.

### What it is

A local-first desktop app where you create agents, organize them into a visual space, and run real work with real models and tools. The visual station is a projection of live runtime state, not a simulation layered on top of fake results.

### What it is not

It is not a skin over the hosted web platform. It is a separate runtime with its own agent execution, local persistence, provider connections, budgets, consent, and deliverables.

### Package identity

- Package name: `trendly-os`
- Description: "Trendly OS — Visual command center and agent harness for Trendly autonomous swarms."

### Runtime architecture

- **Desktop shell** — `src-tauri/`, the Tauri v2 shell and bundled runtime.
- **Frontend** — `frontend/`, the station UI and world.
- **Sidecar** — `sidecar/`, the local Node agent runtime for providers, tools, persistence, budgets, and consent.
- **Shared contracts** — `shared/`, additive cross-boundary event and schema contracts.
- **Tests and QA** — `test/` and `qa/`.

The frontend consumes real sidecar events over localhost HTTP/NDJSON and SSE. Secrets live with the local authority: sidecar / OS keychain, not the frontend.

### Provider model

- Bring your own OpenRouter key, or sign in with supported provider accounts.
- Local model option via Ollama on `127.0.0.1:11434` for keyless local use.
- Model calls stream through the local Node sidecar; tools run through explicit capability and consent checks.

### Product posture

The harness performs real model calls, real tools, and real cost. It does not simulate revenue, completed work, model activity, or spend. Its core law is that the interface must never assert state the harness cannot prove.

### Sidecar layout

The sidecar is the real harness. Key areas include:

- Agent loop
- HTTP + SSE server
- Providers
- Capability resolution
- Tools
- Channels
- MCP
- Cron
- Cost/spend/ledger
- Persistence stores
- Memory
- Safety: permissions, grants, local API auth, E-STOP

### Frontend layout

The station frontend is a vanilla JS world plus UI. Key areas include:

- World render
- Model / bake
- State spine
- COMMS
- Growth
- Work
- Recruit
- Build
- Chrome
- Persistence
- Legacy v7

### Shared contracts

`shared/` is the frozen cross-boundary contract between frontend and sidecar. It is additive-only by request and should not be renamed or removed casually.

### Scripts and release story

The sidecar can be started directly with `node sidecar/index.js`. The repo also includes a large surface of QA, release, evaluation, and security scripts, including:

- `test:fast`, `test:http`, `test`
- `security:secrets`
- `qa:ready` and a broad `qa/*` journey/reconciliation/evidence surface
- `eval/*` and `phase*` scripts for live and offline evaluation
- release signing, update delivery, and distribution scripts

---

## How the pieces relate

- **Web platform** is the hosted, multi-user surface for Trendly: account, community, monetization, observability APIs, council/gatekeeper behavior, and the agent/swarm surface as seen from the browser.
- **Swarm behavior and observability** are shared concerns. In this repo they are implemented primarily in `nextjs_space/`, where decisions are logged, outcomes are correlated, calibration is computed, and council/gatekeeper debate can run. The same conceptual layer — real autonomous work, real routing, real observability — is what the desktop harness is built to run in a local runtime.
- **Desktop harness** is the local, individually-owned runtime for the same kind of autonomous work: real agents, real models, real tools, real ledgers, with a visual station that reflects proven runtime state instead of inventing it.

In other words: the web platform is where the swarm is hosted, observed, and governed. The desktop harness is where comparable autonomous work can be executed locally under explicit local control.

### Deliberate separations

- The web platform owns hosted user data, platform money flows, and the hosted observability record.
- The desktop harness owns local agent runs, local persistence, and local provider credentials.
- Both can express autonomous swarm behavior, but they do it in different runtimes with different trust models.
- Secrets belong to the local authority in the desktop harness and to the platform environment in the web app.

---

## Key entry points and scripts

### Web platform

- Root dev: `cd nextjs_space && npm run dev`
- Build: `npm run build`
- Test: `npm run test` and `npm run test:watch`
- Lint: `npm run lint`
- Postinstall: Prisma generate

Swarm and observability helper scripts in `nextjs_space/` include:

- `swarm:seed`
- `swarm:reset`
- `reinvest`, `reinvest:daemon`, `reinvest:dry`
- `observability:worker`
- `observability:verify`

Local development assumes Docker Compose for Postgres + Redis.

### Desktop harness

- Sidecar start: `node sidecar/index.js`
- Desktop dev: `npm run desktop:dev`
- Desktop build: `npm run desktop:build`
- Web demo sync: `npm run sync:website`
- Fast tests: `npm run test:fast`
- HTTP tests: `npm run test:http`
- Combined test: `npm test`
- Secret scan: `npm run security:secrets`
- Release readiness: `npm run qa:ready`

---

## Suggested next documentation steps

- Build a dependency/feature map for `nextjs_space/` so the hosted platform's surface area is explicit per subsystem.
- Build a dependency/feature map for `starnet/` so the desktop harness's runtime surface is explicit.
- Split this document into per-system architecture docs: one for the web platform, one for the swarm/observability layer, one for the desktop harness.
- Derive an integration-point map between the hosted web platform and the desktop/sidecar runtime: which concepts cross the boundary, which stay local, and which are deliberately separate.
- Add a runtime-flow diagram for the autonomous revenue swarm pulse and for the observability cycle, since those are the two most cross-cutting behaviors in the repo.
