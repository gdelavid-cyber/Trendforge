# S6 Implementation Plan — Real Execution, On-Chain Deposits & Guided Onboarding

Spec: `docs/superpowers/specs/2026-08-24-real-execution-deposits-guide-design.md`.
Goal: bots produce real outputs (research/files/emails/posts/trades), users fund
agents with real Solana USDC to activate Web4 economics, fake money is removed,
and a spotlight tour + `/guide` hub explains everything.

## Scope decisions (honest cuts)
- Integrations v1 = paste keys into Profile → Integrations (same UX as BYOK
  LLM keys). Full OAuth handshakes (X callback flow) deferred.
- Deposits: single platform treasury (env address), Solana USDC only,
  reference-code matching, cron verifier. No per-agent custody, no other
  chains. Deposits credit after ≥1 confirmation.
- Withdrawals: request → admin review queue. No auto-payout in v1.
- Research: readable-text fetch of top N results (search via connected
  serper/tavily/brave key, DDG HTML fallback). No headless-browser rendering.
- Trades: Polymarket only, always approval-gated, allocation hard-capped at
  the agent's ledger balance.
- Migration honesty: existing simulated balances become a labeled
  `ADJUSTMENT` entry (`ref: legacy-simulated`) per agent; new agents start $0.
- Tour: desktop-first spotlight overlay; `/guide` hub is fully responsive.
- Battles: entry fee debits ledger, winner credits the pot. No platform rake v1.

## Tasks

### T1 — Honesty pass + ledger foundation
Prisma: `LedgerEntry`, `Deposit`, `TaskArtifact`, `WithdrawalRequest`,
`OnboardingProgress.tourDone/guideSeenAt`; `Web4Agent.walletBalance`
default 0. Migration: backfill `ADJUSTMENT(legacy-simulated)` entries for
existing balances. Delete simulated `totalEarnings` increments (web4 yield,
battle payouts, grants); Total Earnings surfaces = real ledger credits.
`generateConwayWallet` → balance 0. Tests: ledger math, idempotent
double-credit, wallet-starts-at-zero regression.

### T2 — Integration vault
`UserIntegrationKey` model + `lib/integrations/vault.ts` (encrypt/decrypt/
mask, provider registry: sendgrid, resend, x, polymarket, websearch).
API `GET/PUT/DELETE /api/settings/integrations`. Profile → Integrations
card (provider picker, key field, masked status, disconnect). Tests:
vault round-trip per provider, masked API output.

### T3 — Skills engine v2 (real runners)
`lib/execution/runners/`: WebResearchRunner (search + fetch + grounded
synthesis, RESEARCH artifact), FileRunner (CSV/MD → S3, FILE artifact),
EmailRunner (sendgrid/resend key, EMAIL artifact), SocialRunner (X API v2,
POST artifact), TradeRunner (Polymarket CLOB, approval-gated + balance cap,
TRADE artifact + TRADE_ALLOCATION ledger debit). Runner registry in
skills.ts; missing key → `BLOCKED_NEEDS_KEY` guidance outcome with deep
link, never a fake result. Task page renders artifacts ("Actual outputs").
Tests: resolution order, gating without keys (no LLM call), artifact rows,
approval requirement for external actions (providers mocked).

### T4 — Deposits + Darwinism activation
Per-agent 8-char referenceCode; deposit panel on web4 agent page (treasury
address, code, memo instructions, pending/credited list).
`app/api/cron/deposits` verifier: signatures-since-cursor → parse USDC
transfer + memo → match → Deposit row → LedgerEntry(DEPOSIT) + balance bump
in one transaction (idempotent on txSignature and [agentId,type,ref]).
Darwinism gate: survival engine + yield jobs skip balance ≤ 0 agents
("dormant" UI state). Battles: entry debit / pot credit via ledger, reject
insufficient funds. WithdrawalRequest UI + admin review action. Tests:
memo parsing (SPL memo + Memo program), unknown-ref rejection, cursor
advance, gate behavior, battle ledger flow.

### T5 — Guide hub + spotlight tour + companion wiring
`lib/guide/content.ts` (every page: what it does / what you can do / tips /
spotlight selectors). `/guide` responsive hub with anchor nav; marks
guideSeenAt. `components/guide/spotlight-tour.tsx`: element-spotlight
walkthrough, keyboard nav, reduced-motion respect, auto-shows once
(tourDone), replay via header Help button + /guide. brain.ts injects
condensed guide into companion system prompt. Tests: status API persists
tourDone/guideSeenAt.

### T6 — Polish sweep
Copy honesty audit (no hype strings, projections labeled "estimate"),
loading/empty states for new panels (integrations, deposits, artifacts,
dormant agents), tour visual pass, a11y focus handling.

## Ship checklist
tsc + Vitest green per task commit → push → Vercel probes: `/guide` 200,
Profile integrations roundtrip signed-in, deposit panel renders, task
execute produces artifact row with a connected key in dev.
