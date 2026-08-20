# Trendly — Autonomous Wealth Platform with AI Brain & Agent Swarm

Trendly is a high-scale autonomous wealth intelligence platform powered by Next.js 14, Supabase (PostgreSQL), Prisma, NextAuth, Stripe, SendGrid, and background AI Agent Swarms.

Live Production URL: **[https://trendforge-chi.vercel.app](https://trendforge-chi.vercel.app)**

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

### 5. AI Brain Telemetry & HITL Governance (`/admin/brain` & `/admin/health`)
* Autonomous platform monitoring, $200.00 monthly LLM budget cap alarms, and 1-click Human-In-The-Loop (HITL) approval workflows.
* Real-time gateway latency tracking and circuit breaker state machines.

---

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

# Auth & Security
NEXTAUTH_URL="https://trendforge-chi.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret-key"
ENCRYPTION_KEY="your-aes-256-encryption-key"

# Agent Swarm & Quota Configuration
AGENT_QUOTA_FREE_REDDIT=3
AGENT_QUOTA_PRO_REDDIT=999
AGENT_QUOTA_FREE_ARBITRAGE=3
AGENT_QUOTA_PRO_ARBITRAGE=999
AGENT_FALLBACK_ENABLED=true
AGENT_CACHE_TTL=3600
AGENT_USER_SPENDING_LIMIT=10
BRAIN_LLM_COST_BUDGET=200
BRAIN_AUTO_ACTION_ENABLED=false
PIPELINE_API_KEY="4fcb9e6b-bca3-4649-bb3a-7dfedd6fbd6b"

# Feature Flags
ENTERPRISE_ENABLED=true
REFERRAL_COMMISSION_PERCENT=10
SUCCESS_FEE_PERCENT=5
COMMUNITY_ENABLED=true
WORKFLOW_ENABLED=true
```

---

## 💻 Local Development

```bash
# 1. Start local Postgres & Redis
docker-compose up -d

# 2. Install dependencies & push schema
cd nextjs_space
npm install
npx prisma generate
npx prisma db push

# 3. Start local development server
npm run dev
```
