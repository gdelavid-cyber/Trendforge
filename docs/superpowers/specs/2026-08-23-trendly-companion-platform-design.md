# Trendly — Companion Workforce Platform Design

**Date:** 2026-08-23
**Status:** Approved design (pending implementation plan)
**Supersedes:** "TrendForge" naming and dark/gold design system references

---

## 1 · Vision

Everyone uses AI, but nobody has ever *seen* theirs. Trendly is the first
platform where you customize your AI companion — give it a face, a style, a
identity — and then put it to work earning money through trending,
executable wealth-tasks.

**The loop:**

1. **Forge** your companion (look, personality, skills)
2. Pick a trending money-task from this week's radar
3. Choose your involvement: **DIY** · **Co-pilot** · **Autopilot**
4. Your companion works: researches clients, drafts pitches, preps deliverables
5. You receive an email → review → **one-click approve-to-send → get paid**

The human clicks two buttons total. The AI does 95%.

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
| **My Companion ▾** | The Forge `/avatar-studio` · Approval Inbox *(S2)* · Activity Feed *(S3)* |
| **Arena ▾** | Arena `/arena` · Battles `/battles` · Cosmetics `/cosmetics` |
| **Build ▾** | Agent Studio `/builder` · My Agents `/agents` · Workflows `/workflows` |
| Community | `/community` |
| **Market ▾** | Marketplace `/marketplace` · Referrals `/referrals` · Pricing `/pricing` |

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

## 4 · Task Execution Modes (the money loop, S2)

Per-task mode selection: `DIY | CO_PILOT | AUTOPILOT`.

**Autopilot = approve-to-send.** The companion drafts everything; the human
approves outbound actions. Rationale: Upwork/Fiverr prohibit fully automated
bidding; auto-sending would endanger users' accounts and livelihoods.
Approve-to-send keeps users safe AND preserves the product promise ("I just
approved the payday").

### 4.1 Data model (additive, Prisma)

```
enum ExecutionMode   { DIY CO_PILOT AUTOPILOT }
enum SubmissionState { DRAFTING PENDING_REVIEW APPROVED_SENT CLIENT_REPLIED DELIVERED PAID FAILED }

model TaskSubmission {
  id            String          @id @default(cuid())
  userTaskId    String          @unique
  userTask      UserTask        @relation(fields:[userTaskId], references:[id])
  mode          ExecutionMode
  state         SubmissionState @default(DRAFTING)
  platform      String?         // upwork | fiverr | direct | ...
  clientResearch Json?          // scraped/summarized prospect intel
  pitchDraft    String?
  deliverable   String?
  submittedAt   DateTime?
  paidAmount    Float?
  companionId   String?         // free-form until S3 adds the avatar↔agent
                                // relation; tracks which companion did the work
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}
```

Emails fire at each gate (existing Abacus notification pattern):
draft ready → approval needed → sent confirmation → payment reminder.

### 4.2 Mode behaviors

| Mode | Companion does | Human does |
|---|---|---|
| DIY | Nothing (advisory tips only) | Everything |
| Co-pilot | Drafts pitch/deliverable sections on request | Edits, sends, delivers |
| Autopilot | Client research, pitch draft, deliverable prep, queues submission | Reviews inbox → Approve-to-send → Finalize-for-payment |

## 5 · Roadmap (each phase ships independently)

| Phase | Scope | Depends on |
|---|---|---|
| **S1 — Skeleton** | Nav IA + demotions + Trendly brand sweep + landing/dashboard retell toward companion-first story | nothing |
| **S2 — Money loop** | Execution modes, TaskSubmission model, Approval Inbox page, gate emails | S1 nav slot exists |
| **S3 — Companion identity** | Avatar↔agent binding surfaced during tasks; Activity Feed ("your companion researched 12 clients…"); cosmetics as task rewards | S2 |
| **S4 — Lead-gen assistant** | Upwork/Fiverr prospect discovery → research cards feeding Autopilot drafts | S2 |
| Later | Real payout integrations, multi-companion workforces | out of scope here |

## 6 · Non-goals (explicit)

- No fully-automated platform bidding (ToS risk to users).
- No route renames/moves in S1–S2.
- No payment processing changes — earnings arrive via the external platforms;
  Trendly tracks and celebrates them.
- No removal of existing features (demote ≠ delete).

## 7 · Safety & verification per phase

- `tsc --noEmit` + Vitest suite green before every commit.
- Post-deploy probe of changed surfaces (nav render, footer, admin menu auth).
- S2 adds unit tests for submission state machine transitions before enabling
  Autopilot for any real user.
- Schema additions are additive-only; `prisma db push` against shared Supabase
  with dev-server stopped (Windows DLL lock), matching established procedure.
