# SECRETS MIGRATION REPORT
Trendly OS Rebuild — Phase 1

## Existing Secrets Audit

Discovered in: nextjs_space/.env:16, nextjs_space/.env.local:29
  Type: Stripe
  Variable name: STRIPE_SECRET_KEY
  Status: ACTIVE / DUPLICATE
  Mapped to new variable: STRIPE_SECRET_KEY
  Masked value: sk_test_51TZy...NECv

Discovered in: nextjs_space/.env:18
  Type: Stripe
  Variable name: STRIPE_WEBHOOK_SECRET
  Status: ACTIVE
  Mapped to new variable: STRIPE_WEBHOOK_SECRET
  Masked value: whsec_pIIC...e29u

Discovered in: nextjs_space/.env:17, nextjs_space/.env:19, nextjs_space/.env.local:14, nextjs_space/.env.local:28
  Type: Stripe
  Variable name: STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  Status: ACTIVE / DUPLICATE
  Mapped to new variable: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  Masked value: pk_test_51TZy...m3H

Discovered in: nextjs_space/.env:13
  Type: OpenRouter
  Variable name: OPENROUTER_API_KEY
  Status: ACTIVE
  Mapped to new variable: OPENROUTER_API_KEY
  Masked value: sk-or-v1-9f2d...4f0b

Discovered in: nextjs_space/.env.local:20, starnet/.env:2, starnet/.env:3, starnet/dev/.env.dev:2, starnet/dev/.env.dev:3
  Type: OpenRouter
  Variable name: OPENROUTER_API_KEY, OPENROUTER_KEY
  Status: DUPLICATE
  Mapped to new variable: OPENROUTER_API_KEY (consolidate to primary)
  Masked value: sk-or-v1-0699...fce

Discovered in: nextjs_space/.env:48
  Type: InferHub / Gemini Gateway
  Variable name: INFERHUB_API_KEY
  Status: ACTIVE
  Mapped to new variable: INFERHUB_API_KEY
  Masked value: sk-airo-Rhop...4iWK

Discovered in: nextjs_space/.env:1
  Type: PostgreSQL (Supabase Pooler)
  Variable name: DATABASE_URL
  Status: ACTIVE
  Mapped to new variable: DATABASE_URL
  Masked value: postgresql://postgres...aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true

Discovered in: nextjs_space/.env:2
  Type: PostgreSQL (Supabase Direct)
  Variable name: DIRECT_URL
  Status: ACTIVE
  Mapped to new variable: DIRECT_URL
  Masked value: postgresql://postgres...aws-0-us-east-2.pooler.supabase.com:5432/postgres

Discovered in: nextjs_space/.env:10
  Type: NextAuth
  Variable name: NEXTAUTH_SECRET
  Status: ACTIVE
  Mapped to new variable: NEXTAUTH_SECRET
  Masked value: CQY0...3Dia

Discovered in: nextjs_space/.env.local:25, starnet/.env:9, starnet/dev/.env.dev:9
  Type: HMAC Shared Secret
  Variable name: STARNET_BRIDGE_SECRET, TRENDFORGE_BRIDGE_SECRET
  Status: DEPRECATED
  Mapped to new variable: Superseded by TRENDLY_NODE_INVITATION_TOKEN

Discovered in: nextjs_space/.env.local:2, nextjs_space/.env.local:17, .env.local:6, .env.local:7
  Type: Cron Secret
  Variable name: CRON_SECRET, OBSERVABILITY_API_KEY
  Status: ACTIVE / DUPLICATE
  Mapped to new variable: CRON_SECRET
  Masked value: 74af...99a6

Discovered in: nextjs_space/.env:24, worker/.env:2
  Type: Scraper Pipeline Key
  Variable name: PIPELINE_API_KEY
  Status: UNUSED
  Mapped to new variable: Delete

Discovered in: nextjs_space/.env:28
  Type: fal.ai Recraft (Image Gen)
  Variable name: IMAGE_API_KEY
  Status: UNUSED
  Mapped to new variable: Delete

Discovered in: nextjs_space/.env:4, nextjs_space/.env:7, nextjs_space/.env:45
  Type: Abacus.AI & AWS S3
  Variable name: ABACUSAI_API_KEY, AWS_BUCKET_NAME, NOVA_SERVICE_KEY
  Status: UNUSED
  Mapped to new variable: Delete

---

## DUPLICATES FOUND:
- STRIPE_SECRET_KEY appears in 2 locations: nextjs_space/.env, nextjs_space/.env.local
  Resolution: Kept in root .env, removed duplicates.
- STRIPE_PUBLISHABLE_KEY appears in 4 locations: nextjs_space/.env, nextjs_space/.env.local
  Resolution: Kept as NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in root .env.
- OPENROUTER_API_KEY appears in 5 locations across 3 files: nextjs_space/.env, nextjs_space/.env.local, starnet/.env, starnet/dev/.env.dev
  Resolution: Consolidated to root .env.
- CRON_SECRET appears in 4 locations across root .env.local and nextjs_space/.env.local
  Resolution: Consolidated to root .env.

---

## UNUSED KEYS:
- IMAGE_API_KEY in nextjs_space/.env has no references in target OS architecture. Resolution: Deleted.
- ABACUSAI_API_KEY in nextjs_space/.env has no references. Resolution: Deleted.
- AWS_BUCKET_NAME, AWS_FOLDER_PREFIX, AWS_PROFILE in nextjs_space/.env. Resolution: Deleted.
- NOVA_SERVICE_KEY in nextjs_space/.env. Resolution: Deleted.
- PIPELINE_API_KEY in nextjs_space/.env, worker/.env. Resolution: Deleted.
- SENDGRID_API_KEY in nextjs_space/.env (placeholder). Resolution: Deleted (using nodemailer per spec).

---

## MISSING KEYS:
- OPENAI_API_KEY: Optional LLM provider key. Resolution: User must provide if using OpenAI tier.
- ANTHROPIC_API_KEY: Optional LLM provider key. Resolution: User must provide if using Anthropic tier.
- GEMINI_API_KEY: Optional LLM provider key. Resolution: User must provide if using direct Google Gemini.
- BETTERCONTACT_API_KEY: Required for Phase 4 outreach discovery/enrichment. Resolution: User must provide.
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_APP_PASSWORD, SMTP_FROM: Required for Phase 4 outreach. Resolution: User must provide.
- IMAP_HOST, IMAP_PORT: Required for Phase 4 reply monitoring. Resolution: User must provide.
- BUSINESS_ADDRESS: Required for CAN-SPAM compliance in email footer. Resolution: User must provide.
- TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, DISCORD_WEBHOOK_URL: Optional for Phase 7 alerting. Resolution: User must provide.

---

## Git History Exposure Audit:
- Scanned git commit history across all branches using regex pattern filters.
- No production secrets or live keys were committed.
- All matches in git log were isolated to unit test fixtures and regex redaction test suites in starnet/test/.
- .gitignore confirmed to ignore .env, .env*.local, and .env*.
