# Trendly — Autonomous Wealth Platform with AI Brain & Agent Swarm

Trendly is a high-scale autonomous wealth intelligence platform built on a web platform plus a desktop harness, with an autonomy and calibration layer between them.

Live production: **[https://trendly-platform-chi.vercel.app](https://trendly-platform-chi.vercel.app)**

> **Use Organization Settings is on.** Go to the repository’s General page and turn it off before changing hosted files, configs, or environment variables.

---

## 📁 Project Split

This workspace is split across two running surfaces:

- **Web platform** — hosted and configured from the infrastructure layer, not from this shell.
- **Desktop harness** — separate, with its own packaging and release model.

The current shell has offline changes staged but not applied, so you are reading source, not the live site.

---

## 🚀 Key Features

### 1. Autonomous Agent Swarm (5 Production Workers)
* **Reddit Problem Scraper & Guide Generator** (`reddit_scraper`): Scrapes subreddits for recurring pain points and synthesizes 3-stage monetization blueprints.
* **Prediction Arbitrage Scanner** (`prediction_arbitrage`): Scans live Polymarket orderbooks, calculates fee-adjusted delta-neutral spreads, and generates paper/live trade payloads.
* **OpenClaw Scraper VPS Deployer** (`openclaw_deployer`): Provisions dedicated headless scraping nodes and anti-bot residential proxy pools.
* **AI Viral Video & Script Generator** (`ai_video_maker`): Generates 9:16 short-form video scripts, ElevenLabs neural voiceovers, kinetic typography, and asset downloads.
* **Micro-SaaS App Scaffolder** (`micro_saas_builder`): Transforms problem prompts into full-stack Next.js App Router applications with Stripe billing and GitHub deployment.

### 2. Multi-Agent Workflows (`/workflows`)
* Visual drag-and-drop pipeline chaining sequential worker nodes (e.g. Reddit Scraper -> Micro-SaaS Builder -> Video Maker).

### 3. Growth & Viral Referral Engine (`/referrals`)
* Unique `/ref/[code]` invite attribution.
* +1 Stackable free Swarm Agent run per active referee.
* 10% recurring Stripe commission payouts.

### 4. Community Hub & Quests (`/community`)
* Topic discussion forums (General, Help, Success Stories, Agent Ideas) with upvotes and threaded comments.
* Daily Operative Quests with Community Points rewards.
* Verified Earner Leaderboard and peer favors exchange.

### 5. Visual AI Companion Layer (Three.js 3D Avatars & Real-Time Voice)
* **Interactive 3D Avatar Engine** (`/avatar-studio`): Real-time Three.js WebGL renderer supporting 4 base archetypes (Cyber Humanoid, Quantum Android, Wall Street Titan, Cosmic Entity), dynamic particle auras, wireframe inspection, and custom cosmetics.
* **Synchronized 60FPS Lip-Sync**: Viseme analysis mapped from real-time Web Audio API frequency spectrums and phoneme sequences (>95% synchronization).
* **Dual Voice System (STT + TTS)**: Speech-to-Text via Web Speech API and Text-to-Speech via ElevenLabs / Google Cloud TTS / browser synthesis fallback.
* **Conversational Agent Brain (`/api/agent/chat`)**: Multi-turn conversational reasoning with Gemini 2.0 / ADK, personality prompts, emotional facial morph targets (`happy`, `surprised`, `thinking`, `confident`, `battle`), and autonomous tool execution (Reddit scraping, DeFi arbitrage, SaaS scaffolding).
* **Cross-Platform Integration**: Spoken companion triggers on Dashboard, Avatar Studio, Web4 Agents, Marketplace live demos, and Battle Arena trash-talk.

### 6. Observability & Calibration Layer
* The platform logs autonomous decisions at the point of execution and backfills their real-world outcomes later.
* Calibration is computed from those paired decisions and outcomes, not from task-by-task honesty assertions.
* This layer is described in more detail with the rest of the architecture docs below.


---

## 🔐 Environment Variables

Environment variables are managed through the hosted workspace, not through this shell.

For orientation only, the surface area the platform has historically used includes AI keys, database and auth config, agent and quota settings, and feature flags. The current README keeps a private stub file here as a reminder of that surface; do not use it as the live configuration source.

Related reference: [docs/setup/environment-vars.md](docs/setup/environment-vars.md)

---

## 💻 Local Development

Local development steps are in [docs/setup/local-dev.md](docs/setup/local-dev.md).

---

## 📁 Project Docs

Newer orientation lives in the project docs folder rather than only in this README:

- [docs/setup/local-dev.md](docs/setup/local-dev.md) — local Postgres/Redis, install, Prisma, and dev server steps.
- [docs/setup/environment-vars.md](docs/setup/environment-vars.md) — what the platform historically needs, split by sensitivity.
- [docs/setup/deployment.md](docs/setup/deployment.md) — hosted deployment model and what is managed where.
- [docs/reference/workers.md](docs/reference/workers.md) — autonomous worker surface the README mentions.
- [docs/reference/jev-gates.md](docs/reference/jev-gates.md) — Jev / approval gate model.
- [docs/reference/observability.md](docs/reference/observability.md) — decision logging, outcome backfill, and calibration.

---

## 🔒 Storage and Access Model

This workspace keeps private configuration out of the hosted files.

For orientation, the platform surface has historically included:

- AI keys and voice/STT settings.
- Database and auth config.
- Agent quotas and spending limits.
- Feature flags and a pipeline API key.

Do not paste live values from chat. If you need to rotate or set one, use the workspace’s secret tooling rather than editing this file.

- Private config and secrets are intended to live in this workspace’s secret store, not in a committed `.env` file.
- The old local `.env` stub is kept only as deleted-scoped reference material.
- Hosted deployment and infrastructure wiring are managed from the infrastructure layer, not from this shell.
---

## 🔐 Access Control Notes

- This repository is configured with custom scopes off for now, so some finer-grained permission changes are limited until that is enabled.
- When using organization-wide settings, review the General page before assuming repo-level edits will take effect.
- If a settings change is rejected, check whether it is blocked by the organization setting banner rather than by the file itself.

---

## 🗂 Existing notes and history

- [docs/archive](docs/archive) — older planning and status docs that were folded in from earlier Trendly workspace notes and are kept as history, not current guidance.
- [starnet/docs](starnet/docs) — companion notes for the desktop harness side of the workspace.

---

## 🧭 Next Steps

If you are landing here for the first time:

- Read the hosted settings page first, because the source you are looking at is not the live site.
- If you need to change config or secrets, go through the workspace’s hosted tooling, not this shell.
- For the current product framing and why this repo is split the way it is, see [ARCHITECTURE.md](ARCHITECTURE.md).
- For recent repo-level changes, see [CHANGELOG.md](CHANGELOG.md).

For deeper setup, see:

- [docs/setup/local-dev.md](docs/setup/local-dev.md) — local Postgres/Redis, install, Prisma, and dev server steps.
- [docs/setup/environment-vars.md](docs/setup/environment-vars.md) — what the platform historically needs, split by sensitivity.
- [docs/setup/deployment.md](docs/setup/deployment.md) — hosted deployment model and what is managed where.

For product surface details:

- [docs/reference/workers.md](docs/reference/workers.md) — autonomous worker surface the README mentions.
- [docs/reference/jev-gates.md](docs/reference/jev-gates.md) — Jev / approval gate model.
- [docs/reference/observability.md](docs/reference/observability.md) — decision logging, outcome backfill, and calibration.

---

## 🗂 Existing notes and history

- [docs/archive](docs/archive) — older planning and status docs that were folded in from earlier Trendly workspace notes and are kept as history, not current guidance.
- [starnet/docs](starnet/docs) — companion notes for the desktop harness side of the workspace.

---

