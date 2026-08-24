# Real Execution, On-Chain Deposits & Guided Onboarding — Design Spec

Date: 2026-08-24
Status: Approved design, pending implementation plan

## Problem

1. Task execution is text-only theater: `research`/`scrape` steps never touch the
   live web (the LLM invents results), and external actions (`send`, `deploy`)
   stop at approval gates with nothing behind them.
2. The Web4 economy is fake: Conway wallets are generated with a hardcoded
   $100 balance, "yield" increments `totalEarnings` out of thin air, and none of
   it is real money.
3. New users get a 5-step agent-deployment pitch, not directions. Nothing
   explains what each page does, what users can do there, or what the bots are
   actually capable of.

## Goals

1. Bots produce **real outputs**: live web research, real file deliverables,
   real emails, real social posts, real trades — each only when the user has
   connected the required key, each auditable, external actions approval-gated.
2. Users can **deposit real USDC (Solana)** into an agent's Conway wallet.
   Web4 "make money or die" (Darwinism, battles, yield economics) activates
   only for funded agents. No hype marketing; the assistant explains
   capabilities when asked.
3. Remove all fake money: wallets start at $0, simulated yield increments are
   gone, Total Earnings reflects only real ledger credits.
4. A one-time **spotlight tour** plus a persistent **`/guide` hub** that
   documents every page: what it does, what you can do, tips. Replayable from
   a header Help button. The AI companion can answer "what does X do / where
   is Y" from the same content.

## Non-Goals (v1)

- Auto-payout withdrawals (manual admin review queue instead).
- Per-agent custodial keypairs (single platform treasury + reference codes).
- Chains other than Solana USDC.
- Trading venues other than Polymarket.
- Mobile-specific tour UX.

## 1. Data Model (Prisma)

```prisma
model UserIntegrationKey {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  provider     String   // 'sendgrid' | 'resend' | 'x' | 'polymarket' | 'websearch'
  encryptedKey String   // AES-256-GCM JSON blob of provider credentials
  meta         Json?    // e.g. verified sender address, x handle, wallet pubkey
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([userId, provider])
}

model LedgerEntry {
  id        String   @id @default(cuid())
  agentId   String
  agent     Web4Agent @relation(fields: [agentId], references: [id])
  userId    String
  type      String   // 'DEPOSIT' | 'TRADE_ALLOCATION' | 'TRADE_PROCEEDS'
                     // | 'BATTLE_ENTRY' | 'BATTLE_PAYOUT' | 'WITHDRAWAL' | 'ADJUSTMENT'
  amountUsdc Float   // signed: positive credits, negative debits
  ref       String   // tx signature, approval id, or admin note — unique per agent+type for idempotency
  note      String?
  createdAt DateTime @default(now())

  @@unique([agentId, type, ref])
  @@index([agentId])
}

model Deposit {
  id            String   @id @default(cuid())
  userId        String
  agentId       String
  chain         String   @default("SOLANA")
  referenceCode String   // 8-char code the sender puts in the transfer memo
  txSignature   String   @unique
  amountUsdc    Float
  status        String   @default("PENDING") // PENDING -> CREDITED | REJECTED
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([referenceCode])
}

model TaskArtifact {
  id          String   @id @default(cuid())
  userTaskId  String
  userTask    UserTask @relation(fields: [userTaskId], references: [id])
  stepIndex   Int
  kind        String   // 'FILE' | 'EMAIL' | 'POST' | 'TRADE' | 'RESEARCH'
  name        String
  url         String?  // S3 url for files, permalink for posts, tx id for trades
  meta        Json?    // provider, recipient, amount, etc.
  createdAt   DateTime @default(now())

  @@index([userTaskId])
}

model WithdrawalRequest {
  id        String   @id @default(cuid())
  userId    String
  agentId   String
  amountUsdc Float
  destination String // user-supplied Solana address
  status    String   @default("PENDING") // PENDING | APPROVED(=paid) | REJECTED
  reviewedBy String?
  createdAt DateTime @default(now())
}
```

`OnboardingProgress` gains `tourDone Boolean @default(false)` and
`guideSeenAt DateTime?` (existing `step`/`isCompleted` keep serving the
deployment checklist).

`Web4Agent.walletBalance` becomes derived-from-ledger for funded economics;
the column stays as a denormalized cache updated in the same transaction as
every `LedgerEntry` insert. Default changes 100.0 → 0.0.

## 2. On-Chain USDC Deposits (activates Web4)

- Env: `SOLANA_TREASURY_ADDRESS`, `SOLANA_RPC_URL` (mainnet; Helius or public
  RPC), `USDC_MINT` (defaults to Solana mainnet USDC).
- Each **agent** gets a stable 8-char `referenceCode` (derived from agentId,
  shown in the deposit panel on the web4 agent page and in `/guide#funding`) —
  deposits always target one specific agent.
- Deposit instructions UI: "Send USDC (Solana) to `<treasury>` and include
  reference `<code>` in the transfer memo." Memo via SPL transfer memo or the
  Memo program — both parsed.
- **Verifier**: `app/api/cron/deposits/route.ts` (fits existing cron family).
  Each run: `getSignaturesForAddress(treasury)` since last cursor → for each
  new signature, fetch tx → parse USDC transfer amount + memo → match an
  existing user's referenceCode → upsert `Deposit` (idempotent on
  `txSignature`) → on first confirmation ≥ 1, insert `LedgerEntry(DEPOSIT)`
  (unique on `[type, ref]` = second idempotency net) and bump
  `walletBalance` in one transaction → mark `CREDITED`.
  Mismatched/unknown memo → `REJECTED` with note (funds retrievable by admin).
- **Darwinism gate** (`lib/web4/survival-engine.ts`, battles enter, yield
  jobs): skip agents with `walletBalance <= 0`; UI shows "Dormant — fund this
  agent to activate make-money-or-die." No copy changes advertise funding
  anywhere else; the companion explains it only when asked.
- Battles: entry fee debits the ledger (reject insufficient balance), winner
  payout credits it. Real deposited money moves between agent ledgers.

## 3. Skills Engine v2

`lib/execution/skills.ts` becomes a runner registry. Resolution order per
step: matching action runner → internal LLM runner → guidance outcome.

- **WebResearchRunner** (`research`, `scrape`): search via user-connected
  `websearch` key (`meta.vendor` = `'serper'` | `'tavily'` | `'brave'`),
  fallback DuckDuckGo HTML endpoint (no key). Fetches top N pages server-side, extracts
  readable text, LLM synthesizes **from fetched text only**, with source URLs
  in the output. Produces a `RESEARCH` artifact.
- **EmailRunner** (`send` when step meta is email): uses connected
  `sendgrid`/`resend` key; recipient defaults to the account email, or an
  explicit recipient parsed from step/approval meta. Writes an `EMAIL`
  artifact (provider message id).
- **SocialRunner** (`post`): X API v2 with connected `x` key (OAuth
  user-context token in the vault). Writes a `POST` artifact (tweet url).
- **FileRunner** (`export`): renders CSV/Markdown deliverables from step
  outputs, uploads via existing `lib/s3.ts`, artifact carries the URL.
- **TradeRunner** (`trade`): Polymarket CLOB via connected `polymarket` key.
  Always approval-gated; allocation capped at agent `walletBalance`; writes
  `TRADE_ALLOCATION` debit + `TRADE` artifact.
- **Missing key** → the step resolves to a guidance outcome: companion
  message stating exactly what to connect (deep link `Profile → Integrations`)
  and marks the step `BLOCKED_NEEDS_KEY`, never fakes the action.
- Every external action still flows through the existing Approval gate before
  its runner fires; every fired action appends to `stepResults` and creates a
  `TaskArtifact`.

## 4. Honesty Pass

- `generateConwayWallet`: `balance: 0.0`; new agents are "dormant" until
  funded. Existing agents keep their number but it is now ledger-backed going
  forward (one-time migration: current balance becomes a labeled `ADJUSTMENT`
  entry with ref `legacy-simulated`, so history is transparent).
- Delete simulated increments: web4 yield route, battle payouts to
  `totalEarnings`, grants crediting `totalEarnings` — replaced by ledger
  entries only where real money is involved.
- `totalEarnings` UI surfaces = sum of positive ledger entries (real credits).
- Copy audit: projections labeled "estimate"; the existing compliance
  disclaimers stay; no "primed wallet / extract yield" hype strings.

## 5. Guide Hub + Spotlight Tour

- **`lib/guide/content.ts`** — single source of truth: ordered sections, each
  with page path, name, "what it does", "what you can do", tips, and optional
  spotlight selectors. Powers `/guide` (clean, organized hub page with anchor
  nav), the tour, and the companion's system prompt (brain.ts injects a
  condensed version so the assistant answers "what does this do / where is X"
  accurately).
- **Spotlight tour** (`components/guide/spotlight-tour.tsx`): global
  nav-anchored walkthrough — highlights real elements per stop (dashboard
  card, task execute buttons, studio tabs, deposit panel…), next/back/exit,
  progress dots, keyboard navigable, respects `prefers-reduced-motion`.
  Shown once automatically (OnboardingProgress.tourDone), replayable via a
  header **Help** button and from `/guide`.
- `/guide` marks `guideSeenAt`; tour completion marks `tourDone` via the
  existing onboarding status/complete API (extended fields).

## 6. Security

- Integration keys: AES-256-GCM via existing `lib/encryption.ts`; never
  returned raw by any API (masked only); never logged; runners read decrypted
  values in-process only.
- Deposits: idempotent double-net (unique `txSignature` + unique
  `[LedgerEntry.type, ref]`); amounts parsed from chain data, never client
  input; verifier runs server-side with RPC creds.
- Trades: approval-gated + balance-capped; no runner can spend more than the
  agent's real ledger balance.
- Withdrawals: admin-reviewed only; destination address captured at request
  time; payout recorded as ledger entry with reviewer ref.
- Cron routes: reuse existing auth pattern for cron endpoints.

## 7. Testing (vitest, existing DB-fixture style)

- Ledger: balance math, idempotent double-credit rejection, signed amounts.
- Deposit matcher: memo parse (SPL memo + Memo program), unknown-reference
  rejection, confirmations threshold, cursor advance.
- Vault: encrypt/decrypt round-trip per provider, masked API output.
- Runners: action→runner resolution; missing key → `BLOCKED_NEEDS_KEY`
  guidance (no LLM call, no fake output); external action requires approval;
  artifact row created on fire (providers mocked).
- Honesty: new wallets start at 0; no code path increments `totalEarnings`
  without a ledger entry (regression test over battle/yield routes).
- Tour: status API persists `tourDone`/`guideSeenAt`; tour shows once.

## Build Order

1. Honesty pass + `LedgerEntry`/balance migration.
2. `UserIntegrationKey` vault + Profile → Integrations UI.
3. Runners: research → export → email → social → trade (+ artifacts).
4. Deposits: reference codes, deposit UI, cron verifier, Darwinism gate,
   battle ledger integration, withdrawal queue.
5. Guide content + `/guide` hub + spotlight tour + companion prompt wiring.
6. Polish sweep: copy honesty audit, loading states, empty states.
