export interface SkillDefinition {
  id: string;
  name: string;
  category: 'SCRAPER' | 'FINANCE' | 'OUTREACH' | 'MEDIA' | 'CODE' | 'SOCIAL' | 'UTILITY';
  description: string;
  inputs: { name: string; type: string; default?: any; placeholder?: string; required?: boolean }[];
  outputs: { name: string; type: string; description: string }[];
  computeCostUsdc: number;
  icon: string;
}

export const SKILLS_LIBRARY: SkillDefinition[] = [
  // 1. DATA MINING & SCRAPING
  {
    id: 'scrape_reddit_painpoints',
    name: 'Reddit Pain Point Miner',
    category: 'SCRAPER',
    description: 'Scrapes targeted subreddits for recurring commercial complaints and unmet software needs.',
    inputs: [
      { name: 'subreddit', type: 'string', default: 'SaaS', placeholder: 'e.g. SaaS, Entrepreneur' },
      { name: 'keywords', type: 'string', default: 'frustrated, alternative, broken', placeholder: 'e.g. churn, hate, broken' },
      { name: 'maxPosts', type: 'number', default: 20 },
    ],
    outputs: [
      { name: 'painPoints', type: 'array', description: 'List of validated problem vectors with frequency scores' },
      { name: 'rawPosts', type: 'array', description: 'Raw scraped post telemetry' },
    ],
    computeCostUsdc: 0.05,
    icon: '🤖',
  },
  {
    id: 'scrape_hackernews_launches',
    name: 'HackerNews Launch Radar',
    category: 'SCRAPER',
    description: 'Monitors breaking Show HN submissions and GitHub repositories with high upvote velocity.',
    inputs: [
      { name: 'minScore', type: 'number', default: 50 },
      { name: 'limit', type: 'number', default: 15 },
    ],
    outputs: [
      { name: 'viralStories', type: 'array', description: 'Trending stories with discussion sentiments' },
    ],
    computeCostUsdc: 0.02,
    icon: '⚡',
  },
  {
    id: 'scrape_google_maps_local',
    name: 'Google Maps 3-Pack Auditor',
    category: 'SCRAPER',
    description: 'Audits local business directories for missing websites, unoptimized GMB profiles, and bad review ratios.',
    inputs: [
      { name: 'niche', type: 'string', default: 'Roofers', placeholder: 'e.g. Med Spas, Plumbers' },
      { name: 'city', type: 'string', default: 'Austin, TX' },
    ],
    outputs: [
      { name: 'unclaimedLeads', type: 'array', description: 'Target businesses needing AI automation or SEO' },
    ],
    computeCostUsdc: 0.08,
    icon: '📍',
  },
  {
    id: 'scrape_twitter_sentiment',
    name: 'X (Twitter) Sentiment Watcher',
    category: 'SCRAPER',
    description: 'Extracts real-time sentiment shifts, keyword volume spikes, and influencer opinions.',
    inputs: [
      { name: 'query', type: 'string', default: 'DeepSeek local LLM' },
      { name: 'tweetCount', type: 'number', default: 50 },
    ],
    outputs: [
      { name: 'sentimentScore', type: 'number', description: 'Bullish vs Bearish ratio (0.0 - 1.0)' },
      { name: 'keyPhrases', type: 'array', description: 'Top recurring hashtags and terms' },
    ],
    computeCostUsdc: 0.06,
    icon: '🐦',
  },
  {
    id: 'scrape_producthunt_trending',
    name: 'ProductHunt Velocity Scanner',
    category: 'SCRAPER',
    description: 'Monitors top upvoted daily launches on ProductHunt and extracts pricing models.',
    inputs: [{ name: 'daysBack', type: 'number', default: 1 }],
    outputs: [{ name: 'topProducts', type: 'array', description: 'Ranked launch profiles with MRR estimates' }],
    computeCostUsdc: 0.04,
    icon: '🚀',
  },

  // 2. DEFI & FINANCIAL ARBITRAGE
  {
    id: 'polymarket_spread_scanner',
    name: 'Polymarket Arbitrage Scanner',
    category: 'FINANCE',
    description: 'Scans live Polymarket orderbooks for delta-neutral probability mispricings and spread yields.',
    inputs: [
      { name: 'minSpreadPercent', type: 'number', default: 4.5 },
      { name: 'maxBudgetUsdc', type: 'number', default: 500 },
    ],
    outputs: [
      { name: 'arbitrageOpportunities', type: 'array', description: 'Executable orders with projected net ROI' },
      { name: 'executionPayload', type: 'object', description: 'Orderbook trade payload' },
    ],
    computeCostUsdc: 0.10,
    icon: '📈',
  },
  {
    id: 'solana_dex_liquidity_tracker',
    name: 'Solana DEX Liquidity Tracker',
    category: 'FINANCE',
    description: 'Tracks Raydium and Orca concentrated liquidity pools for high APR fee opportunities.',
    inputs: [{ name: 'minTvlUsd', type: 'number', default: 50000 }],
    outputs: [{ name: 'pools', type: 'array', description: 'High fee-to-TVL ratio liquidity pools' }],
    computeCostUsdc: 0.12,
    icon: '🟣',
  },
  {
    id: 'crypto_funding_rate_arbitrage',
    name: 'Funding Rate Delta-Neutral Bot',
    category: 'FINANCE',
    description: 'Calculates spot vs perpetual futures funding rate yield across crypto exchanges.',
    inputs: [{ name: 'symbol', type: 'string', default: 'SOL' }],
    outputs: [{ name: 'annualizedApr', type: 'number', description: 'Projected delta-neutral APR' }],
    computeCostUsdc: 0.08,
    icon: '💰',
  },

  // 3. LEAD GENERATION & COLD OUTREACH
  {
    id: 'b2b_lead_extractor',
    name: 'B2B Decision-Maker Finder',
    category: 'OUTREACH',
    description: 'Enriches company domains with CEO/CTO email addresses, LinkedIn profiles, and company sizes.',
    inputs: [
      { name: 'industry', type: 'string', default: 'Shopify E-Commerce' },
      { name: 'jobTitles', type: 'string', default: 'CEO, Founder, Head of Growth' },
    ],
    outputs: [
      { name: 'leadContacts', type: 'array', description: 'Verified lead list with direct emails' },
    ],
    computeCostUsdc: 0.15,
    icon: '🎯',
  },
  {
    id: 'cold_email_sequence_writer',
    name: '3-Step Cold Email Architect',
    category: 'OUTREACH',
    description: 'Writes highly personalized 3-step cold outreach sequences with high reply rates.',
    inputs: [
      { name: 'valueProposition', type: 'string', default: 'Automated AI Receptionist that saves 15 hours/week' },
      { name: 'targetNiche', type: 'string', default: 'Dental Clinics' },
      { name: 'tone', type: 'string', default: 'concise, provocative, casual' },
    ],
    outputs: [
      { name: 'sequence', type: 'array', description: 'Subject lines, email bodies, and follow-up timings' },
    ],
    computeCostUsdc: 0.05,
    icon: '✉️',
  },
  {
    id: 'sendgrid_bulk_dispatcher',
    name: 'SendGrid Campaign Dispatcher',
    category: 'OUTREACH',
    description: 'Dispatches cold outreach or briefing newsletters directly through your verified SendGrid gateway.',
    inputs: [
      { name: 'recipientEmails', type: 'array' },
      { name: 'subject', type: 'string' },
      { name: 'htmlContent', type: 'string' },
    ],
    outputs: [{ name: 'deliveryStatus', type: 'object', description: '200 OK delivery report' }],
    computeCostUsdc: 0.02,
    icon: '📨',
  },

  // 4. CONTENT & VIRAL MEDIA GENERATION
  {
    id: 'viral_video_scriptwriter',
    name: '9:16 Short-Form Script Generator',
    category: 'MEDIA',
    description: 'Synthesizes high-retention viral scripts for TikTok, YouTube Shorts, and Instagram Reels.',
    inputs: [
      { name: 'topic', type: 'string', default: '3 AI Tools That Pay You While You Sleep' },
      { name: 'targetDurationSec', type: 'number', default: 45 },
    ],
    outputs: [
      { name: 'hook', type: 'string', description: '3-second visual/text hook' },
      { name: 'body', type: 'string', description: 'Fast-paced informational script' },
      { name: 'cta', type: 'string', description: 'Conversion call to action' },
      { name: 'scenePlan', type: 'array', description: 'Second-by-second visual prompts' },
    ],
    computeCostUsdc: 0.06,
    icon: '🎬',
  },
  {
    id: 'elevenlabs_audio_synthesizer',
    name: 'ElevenLabs Voiceover Planner',
    category: 'MEDIA',
    description: 'Generates neural voice settings, pace timing, and pronunciation tags.',
    inputs: [
      { name: 'scriptText', type: 'string' },
      { name: 'voicePreset', type: 'string', default: 'energetic_creator' },
    ],
    outputs: [
      { name: 'audioConfig', type: 'object', description: 'Voice ID, stability, and speed parameters' },
    ],
    computeCostUsdc: 0.05,
    icon: '🎙️',
  },
  {
    id: 'seo_blog_post_generator',
    name: 'Long-Form SEO Ranker',
    category: 'MEDIA',
    description: 'Generates 2,000+ word keyword-optimized articles with Markdown headings and FAQ schema.',
    inputs: [{ name: 'keyword', type: 'string', default: 'Best AI agents for business automation' }],
    outputs: [{ name: 'articleMarkdown', type: 'string', description: 'Complete SEO article' }],
    computeCostUsdc: 0.08,
    icon: '📝',
  },

  // 5. CODE & FULL-STACK DEVELOPMENT
  {
    id: 'nextjs_microsaas_builder',
    name: 'Next.js Micro-SaaS Scaffolder',
    category: 'CODE',
    description: 'Synthesizes complete Next.js 14 App Router repositories with Stripe recurring billing and Prisma models.',
    inputs: [
      { name: 'productIdea', type: 'string', default: 'AI Client Review Aggregator for Shopify' },
      { name: 'niche', type: 'string', default: 'E-Commerce Brands' },
    ],
    outputs: [
      { name: 'sourceFiles', type: 'array', description: 'app/page.tsx, dashboard, stripe route, schema.prisma' },
      { name: 'vercelDeployUrl', type: 'string', description: '1-click Vercel deployment button' },
    ],
    computeCostUsdc: 0.18,
    icon: '💻',
  },
  {
    id: 'openclaw_vps_provisioner',
    name: 'OpenClaw VPS Headless Node Deployer',
    category: 'CODE',
    description: 'Provisions remote Linux servers with Puppeteer/Playwright and rotating proxy clusters.',
    inputs: [
      { name: 'serverIp', type: 'string', default: '198.51.100.42' },
      { name: 'concurrency', type: 'number', default: 16 },
    ],
    outputs: [
      { name: 'deploymentStatus', type: 'object', description: 'Active worker nodes & proxy health latency' },
    ],
    computeCostUsdc: 0.15,
    icon: '🖥️',
  },
  {
    id: 'smart_contract_solidity_auditor',
    name: 'Smart Contract Auditor',
    category: 'CODE',
    description: 'Scans Solidity / Rust smart contracts for reentrancy bugs, unchecked math, and fee drains.',
    inputs: [{ name: 'contractCode', type: 'string' }],
    outputs: [{ name: 'vulnerabilities', type: 'array', description: 'Identified risk vectors and remediation diffs' }],
    computeCostUsdc: 0.12,
    icon: '🛡️',
  },

  // 6. SOCIAL MEDIA & DISTRIBUTION
  {
    id: 'twitter_thread_storm_creator',
    name: 'Viral X/Twitter Thread Storm',
    category: 'SOCIAL',
    description: 'Transforms complex market intel or SaaS launches into a high-engagement 7-tweet thread.',
    inputs: [{ name: 'coreInsight', type: 'string' }],
    outputs: [{ name: 'threadTweets', type: 'array', description: 'Formatted numbered tweets with engagement hooks' }],
    computeCostUsdc: 0.04,
    icon: '🧵',
  },
  {
    id: 'linkedin_thought_leader_post',
    name: 'LinkedIn Executive Post Crafter',
    category: 'SOCIAL',
    description: 'Formulates B2B thought-leadership posts engineered for corporate sharing and founder inbound.',
    inputs: [{ name: 'topic', type: 'string' }],
    outputs: [{ name: 'postContent', type: 'string' }],
    computeCostUsdc: 0.03,
    icon: '💼',
  },
  {
    id: 'discord_alert_webhook',
    name: 'Discord / Telegram Alpha Webhook',
    category: 'SOCIAL',
    description: 'Dispatches real-time rich embed notifications to private Discord or Telegram alpha channels.',
    inputs: [
      { name: 'webhookUrl', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'message', type: 'string' },
    ],
    outputs: [{ name: 'success', type: 'boolean' }],
    computeCostUsdc: 0.01,
    icon: '🔔',
  },
];
