# Contributing to Trendly

Welcome! This guide outlines how to contribute to Trendly's autonomous wealth platform, AI Brain, and Agent Swarms.

---

## 🛠️ Tech Stack

* **Frontend & Framework**: Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion, Lucide Icons.
* **Database & ORM**: PostgreSQL (Supabase), Prisma ORM.
* **Authentication**: NextAuth.js (Credentials & JWT Sessions).
* **Payment & Subscriptions**: Stripe Checkout & Customer Portal.
* **AI & Swarm Engine**: LLM pipelines with in-memory / Redis result caching, circuit breakers, and async execution daemons.

---

## 🚀 Local Development Setup

### 1. Prerequisites
* Node.js v18+ or v20+
* Docker & Docker Compose (optional for local Postgres/Redis)

### 2. Environment Variables
Copy `.env.example` or configure your `.env` file in `nextjs_space/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/trendly_db"
DIRECT_URL="postgresql://postgres:password@localhost:5432/trendly_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key-32-chars-min"
ENCRYPTION_KEY="development-aes-256-encryption-key"

# Agent & Brain Config
AGENT_QUOTA_FREE_REDDIT=3
AGENT_QUOTA_PRO_REDDIT=999
BRAIN_LLM_COST_BUDGET=200
AGENT_FALLBACK_ENABLED=true
AGENT_CACHE_TTL=3600
```

### 3. Install & Sync Database
```bash
cd nextjs_space
npm install
npx prisma generate
npx prisma db push
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live app.

---

## 🤖 Adding a New Swarm Agent

1. Create a worker file in `lib/agents/[agent-name].ts` implementing:
   ```typescript
   export async function executeMyAgent(params: MyAgentParams, log: (msg: string) => Promise<void>): Promise<MyAgentResult> { ... }
   ```
2. Register the agent in `lib/agents/quota.ts` (`AGENT_CONFIGS`).
3. Add the execution handler branch in `lib/agents/orchestrator.ts`.
4. Add input parameters & results rendering in `app/agents/_components/agents-client.tsx` and `app/agents/[id]/status/_components/agent-status-client.tsx`.

---

## 🧪 Testing Guidelines

Run the unit and integration tests:
```bash
cd nextjs_space
npm test
```
All pull requests must pass `npm run build` and schema validation cleanly.
