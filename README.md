# Trendly — Autonomous Wealth Platform with AI Brain & Agent Swarm

Trendly is a high-scale autonomous wealth intelligence platform powered by Next.js 14, Supabase (PostgreSQL), Prisma, NextAuth, Stripe, SendGrid, and background AI Agent Swarms.

Live Production URL: **[https://trendly-platform-chi.vercel.app](https://trendly-platform-chi.vercel.app)**

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

### 6. Visual AI Companion Layer (Three.js 3D Avatars & Real-Time Voice)
* **Interactive 3D Avatar Engine** (`/avatar-studio`): Real-time Three.js WebGL renderer supporting 4 base archetypes (Cyber Humanoid, Quantum Android, Wall Street Titan, Cosmic Entity), dynamic particle auras, wireframe inspection, and custom cosmetics.
* **Synchronized 60FPS Lip-Sync**: Viseme analysis mapped from real-time Web Audio API frequency spectrums and phoneme sequences (>95% synchronization).
* **Dual Voice System (STT + TTS)**: Speech-to-Text via Web Speech API and Text-to-Speech via ElevenLabs / Google Cloud TTS / browser synthesis fallback.
* **Conversational Agent Brain (`/api/agent/chat`)**: Multi-turn conversational reasoning with Gemini 2.0 / ADK, personality prompts, emotional facial morph targets (`happy`, `surprised`, `thinking`, `confident`, `battle`), and autonomous tool execution (Reddit scraping, DeFi arbitrage, SaaS scaffolding).
* **Cross-Platform Integration**: Spoken companion triggers on Dashboard, Avatar Studio, Web4 Agents, Marketplace live demos, and Battle Arena trash-talk.

---

## ⚙️ Environment Variables

```env
# AI Companion & Brain Configuration
GEMINI_API_KEY="your-gemini-api-key"
TTS_API_KEY="your-elevenlabs-api-key"
TTS_API_URL="https://api.elevenlabs.io/v1/text-to-speech"
STT_API_KEY="your-stt-api-key"
NEXT_PUBLIC_TTS_ENABLED=true
NEXT_PUBLIC_STT_ENABLED=true
# Database
DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

# Auth & Security
NEXTAUTH_URL="https://trendly-platform-chi.vercel.app"
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
