# Trendly — Autonomous Wealth Platform with AI Brain & Agent Swarm

Trendly is an autonomous wealth intelligence platform powered by Next.js 14, Supabase (PostgreSQL), Prisma, NextAuth, Stripe, SendGrid, and background AI Agent Swarms.

---

## 🧠 AI Brain Architecture

The **AI Brain** is an autonomous platform optimization cluster:
1. **Telemetry Collector** (`/api/cron/brain`): Periodically queries platform activity, active users (7d), MRR, swarm success rates, and token costs.
2. **Anomaly Detection** (`lib/brain/anomaly.ts`): Monitors error spikes (>10%), user engagement dips, and enforces an LLM monthly budget cap ($200.00).
3. **Human-In-The-Loop (HITL) Decision Engine** (`lib/brain/decisions.ts` & `/admin/brain`): Generates low, medium, and high-risk platform recommendations with 1-click admin approval workflows.

---

## 🤖 Agent Swarm (Phase 1)

One-click autonomous agents built for monetization and execution:

### 1. Reddit Problem Scraper & Monetization Guide Generator (`reddit_scraper`)
* **Purpose**: Scrapes trending subreddit discussions, extracts top 3 recurring customer pain points using LLMs, and synthesizes step-by-step product/service monetization blueprints.
* **Quota**: Free: 1 run/week | Pro/Elite: Unlimited.
* **Circuit Breaker**: Trips to `OPEN` state after 3 consecutive failures.

### 2. Prediction Arbitrage Scanner (`prediction_arbitrage`)
* **Purpose**: Queries live prediction market orderbooks (Polymarket Gamma API), identifies mispriced binary contract baskets, and calculates fee-adjusted delta-neutral net yields.
* **Execution**: Supports paper simulation mode ($0 budget) and live exchange order preparation.
* **Quota**: Free: 1 run/week | Pro/Elite: Unlimited.

---

## ⚙️ Environment Variables

Add the following to `.env` or Vercel Environment Variables:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

# NextAuth & Encryption
NEXTAUTH_URL="https://trendforge-chi.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret-key"
ENCRYPTION_KEY="base64-or-32-byte-encryption-key"

# AI Brain & Swarm Controls
AGENT_QUOTA_FREE_REDDIT=1
AGENT_QUOTA_PRO_REDDIT=999
AGENT_QUOTA_FREE_ARBITRAGE=1
AGENT_QUOTA_PRO_ARBITRAGE=999
BRAIN_LLM_COST_BUDGET=200
BRAIN_AUTO_ACTION_ENABLED=false
PIPELINE_API_KEY="4fcb9e6b-bca3-4649-bb3a-7dfedd6fbd6b"

# Optional External AI Keys (Falls back to procedural engine if omitted)
OPENAI_API_KEY="sk-..."
```

---

## 🚀 Local Development

```bash
# 1. Start local PostgreSQL & Redis
docker-compose up -d

# 2. Install dependencies & generate Prisma client
cd nextjs_space
npm install
npx prisma generate
npx prisma db push

# 3. Start development server
npm run dev
```

Live Production URL: **[https://trendforge-chi.vercel.app](https://trendforge-chi.vercel.app)**
