# S7 — Companion Market & Workforces · Design Spec

Date: 2026-08-25
Status: Approved direction, pending implementation plan
Extends: `2026-08-23-trendly-companion-platform-design.md` §6 ("Later" row).
Governs itself under the S6+ honesty model (`LedgerEntry`-backed money only).

> "A companion someone else forged should be able to work for you — and pay
> its maker. A squad of them should work faster than one."

---

## Problem

1. **Marketplace settlement is theater.** `app/api/web4/marketplace/route.ts`
   BUY transfers `Web4Agent` ownership with **zero money movement** —
   `commission` and `sellerPayout` are fabricated numbers returned to the
   client. Cosmetic purchases behave the same. This violates the honesty
   model (non-negotiable) and must be fixed before anything builds on top.
2. **No licensing.** A companion's skills earn only for its owner. There is
   no way to rent execution rights, so good companions never compound.
3. **Single-brain execution.** One `UserTask` = one companion walking steps
   sequentially. Independent steps cannot run in parallel; there is no
   concept of a squad.

## Goals

1. **Real settlement**: every marketplace/licensing payment moves real USDC
   through `LedgerEntry` between agents' wallets, atomically, idempotent,
   balance-capped. Platform rake lands in a seeded treasury agent so every
   dollar stays ledger-traceable.
2. **Licensing**: owners list per-run or per-day execution rights on any
   companion. The engine enforces licenses at run-resolution time; missing
   license → `BLOCKED_NEEDS_LICENSE` guidance (same pattern as
   `BLOCKED_NEEDS_KEY`). Never faked.
3. **Trading**: full ownership transfer of `Companion` rows with explicit
   memory handling (`INCLUDE` | `WIPE`), additive schema, run history intact.
4. **Workforces**: named squads of companions (own + licensed) that fan a
   task's independent structured steps out in parallel, merging results into
   the shared `stepResults` log and artifact pipeline unchanged.

## Non-Goals (v1)

- Auctions/bidding/offers — fixed-price listings only.
- Escrow or dispute flow — settlement is an atomic swap, no holding period.
- Revenue share on hired companions' outputs — upfront fees only.
- Autonomous inter-agent negotiation inside a workforce — deterministic
  coordinator assignment, no agent-to-agent chatter.
- Cross-chain payments, new currencies — Solana-USDC deposits remain the
  only door money enters through.
- Workforce autopilot enablement until its state-machine tests pass
  (standing S2 safety rule applies).

---

## 1 · Data Model (all additive)

```prisma
model CompanionLicense {
  id           String    @id @default(cuid())
  companionId  String
  companion    Companion @relation(fields: [companionId], references: [id])
  ownerId      String
  licenseeId   String
  pricingModel String    // 'PER_RUN' | 'PER_DAY'
  priceUsdc    Float
  maxRuns      Int?      // PER_RUN cap; null = unlimited while active
  runsUsed     Int       @default(0)
  status       String    @default("PENDING") // PENDING -> ACTIVE -> SUSPENDED | REVOKED | EXPIRED
  startsAt     DateTime?
  endsAt       DateTime? // PER_DAY window; null = until revoked
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([companionId])
  @@index([licenseeId])
  @@index([ownerId])
}

model Workforce {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  status    String   @default("ACTIVE") // ACTIVE | ARCHIVED
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members   WorkforceMember[]
  @@index([userId])
}

model WorkforceMember {
  id          String   @id @default(cuid())
  workforceId String
  workforce   Workforce @relation(fields: [workforceId], references: [id])
  companionId String
  companion   Companion @relation(fields: [companionId], references: [id])
  role        String   @default("MEMBER") // 'COORDINATOR' | 'MEMBER'
  source      String   @default("OWN")    // 'OWN' | 'LICENSED'
  licenseId   String?  // required when source = LICENSED
  createdAt   DateTime @default(now())

  @@unique([workforceId, companionId])
  @@index([workforceId])
}
```

Additive columns:

- `UserTask.workforceId String?` — set when launched by a squad;
  `companionId` stays null in that case.
- `LedgerEntry.type` comment gains: `'MARKETPLACE_BUY' | 'MARKETPLACE_SALE' |
  'MARKETPLACE_RAKE' | 'LICENSE_FEE'`. No enum change needed (String column);
  the unique `[agentId, type, ref]` remains the second idempotency net.

## 2 · Settlement layer (fixes the fake market first)

- **Treasury agent**: seed script creates a system-owned `Web4Agent`
  (`TRENDLY_TREASURY`, id in `PLATFORM_TREASURY_AGENT_ID` env). Rake credits
  land there. Nothing is ever "burned" invisibly.
- **`lib/web4/settlement.ts`** — the only code path allowed to mutate
  balances besides deposits/battles/trades today. Exposes one primitive:

  ```ts
  transferFunds(tx, { fromAgentId, toAgentId, amountUsdc, type, ref, note?, rakePercent? })
  ```

  Behavior: re-reads both balances **inside the caller's interactive
  transaction** (no TOCTOU), rejects insufficient funds closed, inserts
  debit + credit (+ optional rake credit to the treasury agent) rows, bumps
  both denormalized `walletBalance` caches in the same transaction.
  Rake rounding: floor to 2 decimals on the rake, seller gets remainder.
- **BUY rewrite** (`web4/marketplace` POST): load listing → pick buyer
  settlement agent (explicit `payFromAgentId`, UI defaults to oldest ACTIVE
  agent with balance > 0) → `transferFunds` with `type: MARKETPLACE_BUY`,
  `ref: listingId`, 10% rake → flip listing `SOLD` → transfer ownership —
  all in one `$transaction`. A second BUY loses the race on `status` check +
  unique refs; loser gets a clean 409.
- **Cosmetics** route through the same settlement primitive (replaces the
  decorative `CosmeticTransaction` amount with real debits/credits).
- **Withdrawal parity**: withdrawals already exist; nothing changes.

## 3 · Companion licensing

- **Listing a license**: owner sets `pricingModel`, `priceUsdc`, optional
  `maxRuns` / day-window. Creates `CompanionLicense(status=PENDING)`.
- **Acquiring**: licensee's settlement wallet pays upfront
  (`LICENSE_FEE`, `ref: licenseId`, rake applied) → license flips `ACTIVE`.
  PER_DAY sets `startsAt/endsAt`. PER_RUN decrements nothing yet.
- **Enforcement** — `lib/companions/access.ts`:

  ```ts
  resolveCompanionForRun(userId, companionId):
    owner?            -> { access: 'OWN' }
    active license?   -> { access: 'LICENSED', licenseId }
    else              -> { access: 'NONE' }
  ```

  Engine calls this wherever `companionId` resolves today (start + resume).
  `NONE` → guidance outcome `BLOCKED_NEEDS_LICENSE` with deep link to the
  companion's market page. No LLM call, no partial run.
- **Consumption**: PER_RUN — after a run where the licensed companion
  executed ≥ 1 step, atomically `runsUsed += 1`; hitting `maxRuns` flips
  `EXPIRED` at resolution time (lazy expiry, no cron needed). PER_DAY —
  expired by `endsAt` comparison at resolution.
- **Owner controls**: suspend/revoke anytime from Profile → Licenses;
  effective at next resolution. Revocation refunds nothing (stated in UI
  before purchase — honest terms).
- **Privacy**: licensed runs execute against the *licensee's* task data.
  Owner sees usage counts and fees earned, never the licensee's artifacts.

## 4 · Companion trading

- **List**: owner creates a `MarketplaceListing(itemType: 'COMPANION')`
  with `price` + memory choice. New `listing.companionId String?` column
  (additive; `agentId` stays for web4-agent sales).
- **Buy**: settlement swap (§2), then:
  - `INCLUDE`: `companion.userId = buyer.id`.
  - `WIPE`: additionally `companion.memory = null` before transfer.
  - `isPrimary` clears for the seller if it was; buyer's primary untouched.
  - Prior `UserTask.companionId` references remain valid — history shows
    provenance ("forged by X, ran N tasks"), which is part of the asset's
    value. Level/rarity/earnings travel with the companion.
- **Delisting**: owner cancels anytime pre-sale (existing CANCELLED status).
- Admin gets a delist control reusing the admin panel pattern.

## 5 · Workforces

- **Builder UI** (`/workforces`): create squad → add own companions +
  browse licensable ones (license purchase inline) → designate coordinator
  (defaults to first own companion; must be an OWN companion in v1).
- **Launch**: task page offers mode `WORKFORCE` when the user has an ACTIVE
  squad; sets `UserTask.workforceId`.
- **Executor** — `lib/execution/workforce.ts`:

  1. Parse structured steps (existing `parseSteps`).
  2. Coordinator plans assignment: score each executable step against each
     member's `skills[]` overlap (deterministic, logged into `stepResults`
     as the plan entry — auditable).
  3. Fan out **independent** steps concurrently (`Promise.all` bounded at
     4 concurrent runners); dependent steps wait for their inputs and reuse
     `previousResults` chaining exactly like the single-brain engine.
  4. Every result appends to the shared `stepResults` log tagged with the
     executing member (`{ member: companionName, stepIndex, ... }`);
     artifacts persist identically.
  5. External/costly steps still become `Approval` rows — gates are
     per-step, not per-member; approval resumes the same member.
  6. Licensed members that executed ≥ 1 step consume a PER_RUN use (§3).
- **Failure isolation**: a member's blocked step (missing key/license) marks
  only that step blocked; the rest of the squad proceeds. Final report lists
  per-member contribution + any `BLOCKED_*` outcomes.
- **Autopilot gate**: workforce AUTOPILOT stays disabled behind a flag until
  its state-machine tests pass (dependency order, gate pause/resume, license
  consumption) — standing safety rule.

## 6 · Security

- All money moves inside `prisma.$transaction` with in-transaction balance
  reads; insufficient funds fail closed with named error codes
  (`INSUFFICIENT_FUNDS`, `LISTING_NOT_ACTIVE`, `SELF_PURCHASE`).
- Idempotency: unique `[agentId, type, ref]` makes replayed BUY/license
  calls no-ops on the ledger.
- License checks run server-side at resolution; client-supplied
  `companionId` can never ride an expired/revoked license (re-resolved on
  every start and resume).
- Memory wipe executes inside the transfer transaction — a sold companion
  never briefly exposes memory to the new owner mid-flight.
- Listing creation rate-limited (reuse existing API-key/session guard
  patterns); admin delist audited via note field on listing update.

## 7 · Testing (vitest, existing DB-fixture style)

- **Settlement**: exact math incl. rake flooring; insufficient-funds
  rejection; double-BUY race → one SOLD, one 409; replayed webhook-style
  retry → zero duplicate ledger entries.
- **Licensing**: lifecycle (PENDING→ACTIVE→EXPIRED/REVOKED/SUSPENDED),
  `maxRuns` lazy expiry, `runsUsed` atomicity under concurrency,
  `BLOCKED_NEEDS_LICENSE` fires with no LLM call, owner-privacy guarantee
  (licensee artifacts invisible to owner APIs).
- **Trading**: ownership transfer + WIPE semantics, primary-flag handling,
  historical `UserTask` references intact post-transfer.
- **Workforce**: assignment determinism given fixed skills, dependency
  ordering (dependent step waits), parallel merge order-independence of
  final results, per-member blocking isolation, license consumption on
  participation, gate pause/resume per step.
- **Regression**: grep-style test asserting no balance mutation occurs
  outside `settlement.ts` / deposit / battle paths.

## Build Order

1. **T1 — Settlement honesty pass**: treasury agent seed, `settlement.ts`,
   marketplace BUY rewrite (agents + cosmetics), tests. *Nothing new ships
   on top of the fake market.*
2. **T2 — Licensing**: models, market listing/acquisition APIs, engine
   enforcement hook, Profile → Licenses UI, tests.
3. **T3 — Trading**: COMPANION listings, transfer + memory semantics,
   marketplace UI, admin delist, tests.
4. **T4 — Workforces**: models, `/workforces` builder, workforce executor,
   task-page launch integration (CO_PILOT first; flag-gated autopilot),
   tests incl. state machine.
5. **T5 — Polish**: guide hub sections (market, licenses, workforces),
   tour stops, empty/loading states, copy audit.

## Verification per phase

`tsc --noEmit` + Vitest green per commit · settlement race tests must pass
before T2 merges · workforce autopilot flag stays off until state-machine
suite passes · post-deploy probes: marketplace GET 200, `/workforces` 200,
license acquisition dry-run on staging data.
