# Trendly Architecture

## Product Framing

Trendly is an autonomous wealth intelligence platform built on a web platform plus a desktop harness, with an autonomy and calibration layer between them.

The platform operates as the "Companion Economy" - users forge AI companions with visual identity and personality, point them at trending money-tasks, and the companion executes real work with one-click approval gates.

### Core Principles

- **Honesty Model (S6+)**: Companions do REAL work or report BLOCKED — they never fake outcomes
- **Ledger-Backed Reality**: Income shown anywhere = ledger-backed real money only (LedgerEntry credits: deposits/trade proceeds/battle pots)
- **Calibration Over Assertions**: Calibration is computed from paired decisions and outcomes, not from task-by-task honesty assertions
- **XP From Action**: Gamification XP derives from completed moves, never from dollars

## Repository Split

This workspace is split across two running surfaces:

1. **Web platform** (`nextjs_space/`) — The main hosted web application
2. **Desktop harness** (`starnet/`) — Separate packaging and release model

The autonomy and observability layer is woven through the web platform.

## Architecture Layers

### 1. Web Platform (nextjs_space/)
The primary application surface providing:
- 17 pages covering landing, auth, dashboard, tasks, community, marketplace, avatar studio, etc.
- 25+ API routes for tasks, trends, community, marketplace, stories, payments, admin
- Prisma ORM with data models
- Stripe subscriptions and payments
- LLM-powered pipeline (7-stage processing)
- S3 file uploads
- Email notifications

### 2. Autonomous Swarm Behavior + Observability
Woven through the web platform:
- **Autonomous Revenue Swarm**: Reddit scraper, prediction arbitrage scanner, OpenClaw deployer, viral video generator, micro-SaaS scaffolder
- **Forge Asset Swarm**: Avatar and asset generation
- **Observability & Calibration**: Decision logging at execution point with outcome backfill later
- **Jev/Gates**: One-click approval gates for autonomous actions

### 3. Desktop Harness (starnet/)
Companion desktop application (trendly-os) with its own packaging. See [starnet/docs](starnet/docs) for details.
